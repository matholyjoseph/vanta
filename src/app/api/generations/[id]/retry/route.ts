import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reserveCredits, checkConcurrencyLimit } from "@/lib/video/pricing";
import { enqueueGeneration } from "@/lib/queue";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const originalGen = await db.generation.findUnique({
      where: { id },
    });

    if (!originalGen) {
      return NextResponse.json({ error: "Original generation not found" }, { status: 404 });
    }

    if (originalGen.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check concurrency limit
    await checkConcurrencyLimit(originalGen.userId);

    // Create new Generation retry job
    const newGen = await db.generation.create({
      data: {
        userId: originalGen.userId,
        modelId: originalGen.modelId,
        mode: originalGen.mode,
        prompt: originalGen.prompt,
        negativePrompt: originalGen.negativePrompt,
        status: "QUEUED",
        progress: 0,
        resolution: originalGen.resolution,
        duration: originalGen.duration,
        aspectRatio: originalGen.aspectRatio,
        seed: originalGen.seed,
        audio: originalGen.audio,
        creditCost: originalGen.creditCost,
        outputCount: originalGen.outputCount,
        referenceAssetIds: originalGen.referenceAssetIds,
      },
    });

    // Reserve credits for the new attempt
    await reserveCredits({
      userId: originalGen.userId,
      amount: originalGen.creditCost,
      generationId: newGen.id,
      description: `Reserved ${originalGen.creditCost} credits for retry generation`,
    });

    // Enqueue
    await enqueueGeneration(newGen.id);

    return NextResponse.json({ success: true, generation: newGen });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retry generation";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
