export type GenerationStatus =
  | "QUEUED"
  | "UPLOADING"
  | "SUBMITTED"
  | "GENERATING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface SubmitGenerationParams {
  generationId: string;
  userId: string;
  modelId: string;
  mode: string;
  prompt: string;
  negativePrompt?: string | null;
  resolution: string;
  duration: string;
  aspectRatio: string;
  fps: number;
  seed?: string | null;
  referenceImageUrl?: string | null;
  motionStrength?: number;
}

export interface GenerationStatusResult {
  jobId: string;
  status: GenerationStatus;
  progress: number; // 0 to 100
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface VideoProvider {
  name: string;
  submitGeneration(params: SubmitGenerationParams): Promise<{ jobId: string; estimatedSeconds: number }>;
  getGenerationStatus(jobId: string): Promise<GenerationStatusResult>;
  cancelGeneration(jobId: string): Promise<boolean>;
}
