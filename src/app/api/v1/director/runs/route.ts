import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeyService } from "@/lib/api/api-key-service";
import { publicDirectorRunRequestSchema } from "@/lib/api/api-types";
import { directorService } from "@/lib/director/director-service";

export async function POST(req: NextRequest) {
  const auth = await apiKeyService.authenticateBearerToken(req.headers.get("authorization"));
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json(
      { error: { type: "authentication_error", code: "unauthorized", message: auth.error } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const parsed = publicDirectorRunRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { type: "invalid_request_error", code: "validation_failed", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const run = await directorService.createDirectorRun(auth.userId, {
      prompt: input.prompt,
      creditBudget: input.max_credits,
    });

    return NextResponse.json(
      {
        id: run.id,
        object: "director_run",
        status: run.status,
        current_stage: run.currentStage,
        prompt: run.originalPrompt,
        estimated_credits: run.creditBudget,
        created_at: run.createdAt.toISOString(),
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: { type: "internal_error", code: "server_error", message: err?.message || "Internal error" } },
      { status: 500 }
    );
  }
}
