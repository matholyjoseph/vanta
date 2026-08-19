import { EventEmitter } from "events";

class GenerationEventHub extends EventEmitter {}

export const eventHub = new GenerationEventHub();
eventHub.setMaxListeners(100);

export function emitGenerationProgress(generationId: string, data: {
  status: string;
  progress: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}) {
  eventHub.emit(`generation:${generationId}`, data);
}
