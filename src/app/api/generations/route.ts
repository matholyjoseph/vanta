import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { calculateGenerationCost, reserveCredits, checkConcurrencyLimit } from "@/lib/video/pricing";
import { enqueueGeneration } from "@/lib/queue";
import { updateUserRecentModelsAction } from "@/app/actions/model-actions";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

const createGenerationSchema = z.object({
  mode: z.enum(["text-to-video", "image-to-video", "video-to-video", "start-end-frame", "motion-control"]).default("text-to-video"),
  prompt: z.string().min(3, { message: "Prompt must be at least 3 characters long" }).max(2000),
  negativePrompt: z.string().optional(),
  modelId: z.string().default("vanta-motion-fast"),
  duration: z.string().default("5s"),
  resolution: z.string().default("1080p"),
  aspectRatio: z.string().default("16:9"),
  seed: z.string().optional(),
  audio: z.boolean().optional().default(false),
  referenceAssetIds: z.array(z.string()).optional(),
  outputCount: z.number().min(1).max(4).optional().default(1),
});

export async function POST(req: Request) {
  try {
    const dbUser = await getAuthenticatedOrGuestUser();

    // Check account suspension
    if (dbUser.accountStatus === "suspended" || dbUser.generationDisabled) {
      return NextResponse.json(
        { error: "Account generation access has been suspended by an administrator." },
        { status: 403 }
      );
    }

    // Check feature flag: generation_maintenance
    const genMaintenanceFlag = await db.featureFlag.findUnique({
      where: { key: "generation_maintenance" },
    });
    if (genMaintenanceFlag?.enabled) {
      return NextResponse.json(
        { error: "Generation Engine is temporarily paused for scheduled maintenance." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const validated = createGenerationSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid generation input", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const {
      mode,
      prompt,
      negativePrompt,
      modelId,
      duration,
      resolution,
      aspectRatio,
      seed,
      audio,
      referenceAssetIds,
      outputCount,
    } = validated.data;

    // Find target AIModel record
    const modelRecord = await db.aIModel.findFirst({
      where: { OR: [{ id: modelId }, { slug: modelId }] },
    });

    // Check model enabled status
    if (modelRecord && !modelRecord.enabled) {
      return NextResponse.json(
        { error: `The AI model '${modelRecord.name}' is currently disabled by administrators.` },
        { status: 400 }
      );
    }

    // Plan Access Check
    if (modelRecord && modelRecord.requiredPlan !== "FREE") {
      const userPlan = dbUser.subscription?.plan?.key || "FREE";
      const planHierarchy: Record<string, number> = { FREE: 0, CREATOR: 1, PRO: 2, ULTRA: 3 };

      const userRank = planHierarchy[userPlan] ?? 0;
      const requiredRank = planHierarchy[modelRecord.requiredPlan] ?? 0;

      if (userRank < requiredRank) {
        return NextResponse.json(
          { error: `Upgrade required: Model '${modelRecord.name}' requires a ${modelRecord.requiredPlan} subscription tier.` },
          { status: 403 }
        );
      }
    }

    const targetModelId = modelRecord?.id || modelId;

    // 1. Check Concurrent Generation Limit
    try {
      await checkConcurrencyLimit(dbUser.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Concurrency limit reached";
      return NextResponse.json({ error: msg }, { status: 429 });
    }

    // 2. Server-side credit cost calculation
    const creditCost = await calculateGenerationCost({
      modelId: targetModelId,
      duration,
      resolution,
      audio,
      outputCount,
    });

    // 3. Create Generation record in DB
    const generation = await db.generation.create({
      data: {
        userId: dbUser.id,
        modelId: targetModelId,
        mode,
        prompt,
        negativePrompt: negativePrompt || null,
        status: "QUEUED",
        progress: 0,
        resolution,
        duration,
        aspectRatio,
        seed: seed || null,
        audio,
        creditCost,
        outputCount,
        referenceAssetIds: referenceAssetIds ? JSON.stringify(referenceAssetIds) : null,
      },
    });

    // 4. Reserve credits in ledger
    try {
      await reserveCredits({
        userId: dbUser.id,
        amount: creditCost,
        generationId: generation.id,
        description: `Reserved ${creditCost} credits for video generation (${duration} ${resolution})`,
      });
    } catch (err: unknown) {
      await db.generation.delete({ where: { id: generation.id } });
      const msg = err instanceof Error ? err.message : "Insufficient credits";
      return NextResponse.json({ error: msg }, { status: 402 });
    }

    // Update User Recent Models tracking
    await updateUserRecentModelsAction(targetModelId);

    // 5. Enqueue Job for processing
    await enqueueGeneration(generation.id);

    return NextResponse.json({
      success: true,
      generation,
    });
  } catch (error) {
    console.error("Generation API error:", error);
    return NextResponse.json(
      { error: "Failed to submit video generation job" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getAuthenticatedOrGuestUser();

    const generations = await db.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { model: true },
    });

    return NextResponse.json({ generations });
  } catch {
    return NextResponse.json({ error: "Failed to fetch generations" }, { status: 500 });
  }
}
