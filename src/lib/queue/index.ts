import { processGenerationJob } from "@/lib/queue/worker";

export async function enqueueGeneration(generationId: string): Promise<void> {
  // Non-blocking async process launch
  setImmediate(() => {
    processGenerationJob(generationId).catch((err) => {
      console.error(`Background worker error processing generation ${generationId}:`, err);
    });
  });
}
