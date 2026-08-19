import { db } from "@/lib/db";
import { providerRegistry } from "@/lib/video/providers/provider-registry";
import { refundCredits } from "@/lib/video/pricing";
import { emitGenerationProgress } from "@/lib/events/hub";
import { getStorageProvider } from "@/lib/storage";

export async function processGenerationJob(generationId: string): Promise<void> {
  const generation = await db.generation.findUnique({
    where: { id: generationId },
    include: { model: { include: { provider: true } } },
  });

  if (!generation) return;
  if (generation.status === "COMPLETED" || generation.status === "CANCELLED") return;

  const providerSlug = generation.model?.provider?.slug || "vanta-mock";
  const provider = providerRegistry.getProviderForModel(providerSlug);
  const targetUserId = generation.userId || generation.guestSessionId || "guest-user";

  try {
    // 1. Mark as SUBMITTED in DB
    await db.generation.update({
      where: { id: generationId },
      data: { status: "SUBMITTED", progress: 5 },
    });
    emitGenerationProgress(generationId, { status: "SUBMITTED", progress: 5 });

    // 2. Submit to AI provider
    const providerJob = await provider.submitGeneration({
      generationId: generation.id,
      userId: targetUserId,
      modelId: generation.modelId,
      providerModelId: generation.model?.providerModelId || undefined,
      prompt: generation.prompt,
      negativePrompt: generation.negativePrompt || undefined,
      mode: generation.mode,
      duration: generation.duration,
      resolution: generation.resolution,
      aspectRatio: generation.aspectRatio,
      seed: generation.seed || undefined,
      audio: generation.audio,
    });

    await db.generation.update({
      where: { id: generationId },
      data: { providerJobId: providerJob.providerJobId },
    });

    // 3. Poll provider status until completion, failure, or cancellation
    let isFinished = false;
    let attempts = 0;
    const maxAttempts = 120; // Up to 6 minutes

    while (!isFinished && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;

      // Check current DB status to see if user cancelled in parallel
      const currentDbGen = await db.generation.findUnique({
        where: { id: generationId },
        select: { status: true },
      });

      if (currentDbGen?.status === "CANCELLED") {
        await provider.cancelGeneration(providerJob.providerJobId);
        emitGenerationProgress(generationId, { status: "CANCELLED", progress: 0 });
        return;
      }

      const statusResult = await provider.getGenerationStatus(providerJob.providerJobId);

      if (statusResult.status === "COMPLETED") {
        isFinished = true;
        const rawVideoUrl = statusResult.videoUrl || "/werewolf_cinematic_preview.jpg";
        let finalVideoUrl = rawVideoUrl;
        let finalThumbnailUrl = statusResult.thumbnailUrl || "/werewolf_cinematic_preview.jpg";

        // Download output server-side & upload to persistent VANTA storage
        if (rawVideoUrl.startsWith("http://") || rawVideoUrl.startsWith("https://")) {
          try {
            const videoRes = await fetch(rawVideoUrl);
            if (videoRes.ok) {
              const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
              const storageKey = `users/${targetUserId}/generations/${generation.id}/output.mp4`;
              const storage = getStorageProvider();
              const uploadRes = await storage.upload(videoBuffer, storageKey, "video/mp4");
              finalVideoUrl = uploadRes.url;
            }
          } catch (storageErr) {
            console.warn("[Worker] Persistent storage transfer failed, using raw provider URL:", storageErr);
          }
        }

        // Update Generation record
        await db.generation.update({
          where: { id: generationId },
          data: {
            status: "COMPLETED",
            progress: 100,
            videoUrl: finalVideoUrl,
            thumbnailUrl: finalThumbnailUrl,
            completedAt: new Date(),
          },
        });

        // Create persistent Asset record
        await db.asset.create({
          data: {
            userId: generation.userId,
            guestSessionId: generation.guestSessionId,
            type: "VIDEO",
            name: `${generation.model?.name || "Vanta AI"} - ${generation.prompt.substring(0, 30)}...`,
            url: finalVideoUrl,
            thumbnailUrl: finalThumbnailUrl,
            mimeType: "video/mp4",
            resolution: generation.resolution,
            duration: generation.duration,
            generationId: generation.id,
          },
        });

        emitGenerationProgress(generationId, {
          status: "COMPLETED",
          progress: 100,
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalThumbnailUrl,
        });
      } else if (statusResult.status === "FAILED") {
        isFinished = true;
        const error = statusResult.errorMessage || "Generation failed on provider engine.";

        await db.generation.update({
          where: { id: generationId },
          data: {
            status: "FAILED",
            progress: 0,
            errorMessage: error,
          },
        });

        // Refund reserved credits
        await refundCredits({
          userId: targetUserId,
          amount: generation.creditCost,
          generationId: generation.id,
          reason: error,
        });

        emitGenerationProgress(generationId, {
          status: "FAILED",
          progress: 0,
          error,
        });
      } else {
        // In Progress (GENERATING / PROCESSING)
        await db.generation.update({
          where: { id: generationId },
          data: {
            status: statusResult.status,
            progress: statusResult.progress,
          },
        });

        emitGenerationProgress(generationId, {
          status: statusResult.status,
          progress: statusResult.progress,
        });
      }
    }

    if (!isFinished) {
      // Timeout
      const errorMsg = "Generation request timed out after 6 minutes.";
      await db.generation.update({
        where: { id: generationId },
        data: { status: "FAILED", errorMessage: errorMsg },
      });
      await refundCredits({
        userId: targetUserId,
        amount: generation.creditCost,
        generationId: generation.id,
        reason: errorMsg,
      });
      emitGenerationProgress(generationId, { status: "FAILED", progress: 0, error: errorMsg });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected worker failure";
    await db.generation.update({
      where: { id: generationId },
      data: { status: "FAILED", errorMessage: errorMsg },
    });
    await refundCredits({
      userId: targetUserId,
      amount: generation.creditCost,
      generationId: generation.id,
      reason: errorMsg,
    });
    emitGenerationProgress(generationId, { status: "FAILED", progress: 0, error: errorMsg });
  }
}
