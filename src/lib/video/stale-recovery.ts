import { db } from "@/lib/db";
import { refundCredits } from "@/lib/video/pricing";
import { emitGenerationProgress } from "@/lib/events/hub";

export async function recoverStaleGenerations(): Promise<number> {
  const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes
  const cutoffDate = new Date(Date.now() - STALE_THRESHOLD_MS);

  const staleGenerations = await db.generation.findMany({
    where: {
      status: { in: ["QUEUED", "SUBMITTED", "GENERATING", "PROCESSING"] },
      createdAt: { lt: cutoffDate },
    },
  });

  let recoveredCount = 0;

  for (const gen of staleGenerations) {
    try {
      const errorMsg = "Generation process timed out and was automatically recovered.";
      await db.generation.update({
        where: { id: gen.id },
        data: {
          status: "FAILED",
          errorMessage: errorMsg,
          completedAt: new Date(),
        },
      });

      await refundCredits({
        userId: gen.userId || gen.guestSessionId || "guest-user",
        amount: gen.creditCost,
        generationId: gen.id,
        reason: errorMsg,
      });

      emitGenerationProgress(gen.id, {
        status: "FAILED",
        progress: 0,
        error: errorMsg,
      });

      recoveredCount++;
    } catch (err) {
      console.error(`Failed to recover stale generation ${gen.id}:`, err);
    }
  }

  return recoveredCount;
}
