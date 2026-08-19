import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { apiKeyService } from "@/lib/api/api-key-service";
import { apiRateLimiter } from "@/lib/api/api-rate-limiter";
import { apiIdempotencyService } from "@/lib/api/api-idempotency-service";
import { webhookDispatcher } from "@/lib/api/webhook-dispatcher";
import { publicGenerationRequestSchema } from "@/lib/api/api-types";
import { reserveCredits } from "@/lib/video/pricing";

export async function POST(req: NextRequest) {
  const requestId = `req_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const startTime = Date.now();

  // 1. Authenticate Bearer Key
  const auth = await apiKeyService.authenticateBearerToken(req.headers.get("authorization"));
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json(
      { error: { type: "authentication_error", code: "unauthorized", message: auth.error, request_id: requestId } },
      { status: 401, headers: { "X-Request-ID": requestId } }
    );
  }

  // 2. Rate Limiting Check
  const rateLimit = apiRateLimiter.checkRateLimit(auth.apiKey!.id, 60, 60000);
  if (!rateLimit.allowed) {
    return apiRateLimiter.createRateLimitErrorResponse(rateLimit.limit, rateLimit.resetSeconds, requestId);
  }

  // 3. Permission Scope Check
  if (!apiKeyService.hasScope(auth.scopes!, "generations:create")) {
    return NextResponse.json(
      { error: { type: "permission_error", code: "insufficient_scope", message: "Key lacks 'generations:create' permission scope.", request_id: requestId } },
      { status: 403, headers: { "X-Request-ID": requestId } }
    );
  }

  try {
    const body = await req.json();

    // 4. Idempotency Key Check
    const idempotencyKey = req.headers.get("idempotency-key");
    if (idempotencyKey) {
      const cached = await apiIdempotencyService.getCachedIdempotentResponse(auth.userId, idempotencyKey, body);
      if (cached) {
        if (cached.isConflict) {
          return NextResponse.json({ error: cached.error }, { status: 409 });
        }
        return NextResponse.json(cached.responseBody, { status: cached.responseStatus });
      }
    }

    // 5. Input Validation
    const parsed = publicGenerationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { type: "invalid_request_error", code: "validation_failed", message: parsed.error.issues[0].message, request_id: requestId } },
        { status: 400, headers: { "X-Request-ID": requestId } }
      );
    }

    const input = parsed.data;
    const estimatedCredits = 20;
    const mediaType = input.mode.includes("video") ? "VIDEO" : input.mode.includes("image") ? "IMAGE" : "AUDIO";

    // 6. Create Generation record
    const generation = await db.generation.create({
      data: {
        userId: auth.userId,
        modelId: input.model,
        mediaType,
        mode: input.mode,
        prompt: input.prompt,
        resolution: input.resolution,
        aspectRatio: input.aspect_ratio,
        duration: `${input.duration}s`,
        status: "QUEUED",
        creditCost: estimatedCredits,
      },
    });

    // 7. Reserve Credits
    try {
      await reserveCredits({
        userId: auth.userId,
        amount: estimatedCredits,
        generationId: generation.id,
        description: `API Generation: ${input.prompt.substring(0, 30)}`,
      });
    } catch (creditErr: any) {
      await db.generation.update({ where: { id: generation.id }, data: { status: "FAILED", errorMessage: creditErr?.message } });
      return NextResponse.json(
        {
          error: {
            type: "insufficient_credits",
            code: "insufficient_balance",
            message: creditErr?.message || "Insufficient wallet credit balance.",
            required_credits: estimatedCredits,
            request_id: requestId,
          },
        },
        { status: 402, headers: { "X-Request-ID": requestId } }
      );
    }

    const responsePayload = {
      id: generation.id,
      object: "generation",
      status: "queued",
      model: input.model,
      mode: input.mode,
      created_at: generation.createdAt.toISOString(),
      estimated_credits: estimatedCredits,
      request_id: requestId,
    };

    // 8. Log API Request
    const durationMs = Date.now() - startTime;
    await db.apiRequestLog.create({
      data: {
        apiKeyId: auth.apiKey!.id,
        userId: auth.userId,
        requestId,
        method: "POST",
        path: "/api/v1/generations",
        statusCode: 202,
        durationMs,
        creditsUsed: estimatedCredits,
        generationId: generation.id,
      },
    });

    // 9. Save Idempotent Response if requested
    if (idempotencyKey) {
      await apiIdempotencyService.saveIdempotentResponse(auth.userId, auth.apiKey!.id, idempotencyKey, body, 202, responsePayload);
    }

    // 10. Dispatch Webhook
    webhookDispatcher.dispatchEvent(auth.userId, "generation.queued", responsePayload).catch(() => {});

    return NextResponse.json(responsePayload, {
      status: 202,
      headers: {
        "X-Request-ID": requestId,
        "RateLimit-Limit": rateLimit.limit.toString(),
        "RateLimit-Remaining": rateLimit.remaining.toString(),
        "RateLimit-Reset": rateLimit.resetSeconds.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { type: "internal_error", code: "server_error", message: err?.message || "Internal API error", request_id: requestId } },
      { status: 500, headers: { "X-Request-ID": requestId } }
    );
  }
}

export async function GET(req: NextRequest) {
  const requestId = `req_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const auth = await apiKeyService.authenticateBearerToken(req.headers.get("authorization"));
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json(
      { error: { type: "authentication_error", code: "unauthorized", message: auth.error, request_id: requestId } },
      { status: 401 }
    );
  }

  const generations = await db.generation.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    object: "list",
    data: generations.map((g) => ({
      id: g.id,
      object: "generation",
      media_type: g.mediaType,
      mode: g.mode,
      status: g.status.toLowerCase(),
      prompt: g.prompt,
      output_url: g.videoUrl || g.imageUrl || g.audioUrl,
      created_at: g.createdAt.toISOString(),
    })),
    has_more: false,
  });
}
