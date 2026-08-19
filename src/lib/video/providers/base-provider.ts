export type InternalGenerationStatus =
  | "QUEUED"
  | "SUBMITTED"
  | "GENERATING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ProviderErrorCategory =
  | "RATE_LIMITED"
  | "MODEL_UNAVAILABLE"
  | "INVALID_INPUT"
  | "MODERATION_REJECTED"
  | "TIMEOUT"
  | "PROVIDER_FAILURE"
  | "INSUFFICIENT_PROVIDER_BALANCE"
  | "STORAGE_FAILURE"
  | "GOOGLE_AUTH_ERROR"
  | "UNKNOWN";

export interface ProviderGenerationRequest {
  generationId: string;
  userId: string;
  modelId: string;
  providerModelId?: string;
  prompt: string;
  negativePrompt?: string;
  mode: string;
  duration: string;
  resolution: string;
  aspectRatio: string;
  seed?: string;
  audio?: boolean;
  referenceImages?: string[];
  referenceVideos?: string[];
  outputCount?: number;
}

export interface ProviderJob {
  providerJobId: string;
  status: InternalGenerationStatus;
  progress: number; // 0 to 100
  estimatedTimeSeconds?: number;
  providerName: string;
}

export interface ProviderGenerationStatus {
  providerJobId: string;
  status: InternalGenerationStatus;
  progress: number;
  errorMessage?: string;
  errorCategory?: ProviderErrorCategory;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface ProviderGenerationResult {
  providerJobId: string;
  status: InternalGenerationStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
  providerCostEstimate?: number;
}

export class ProviderError extends Error {
  category: ProviderErrorCategory;
  rawDetails?: any;

  constructor(message: string, category: ProviderErrorCategory = "UNKNOWN", rawDetails?: any) {
    super(message);
    this.name = "ProviderError";
    this.category = category;
    this.rawDetails = rawDetails;
  }
}

export interface VideoProvider {
  name: string;
  slug: string;

  /**
   * Submits a generation request to the external AI provider engine.
   */
  submitGeneration(request: ProviderGenerationRequest): Promise<ProviderJob>;

  /**
   * Polls or queries the current status of a running generation job.
   */
  getGenerationStatus(providerJobId: string): Promise<ProviderGenerationStatus>;

  /**
   * Retrieves final output artifacts upon job completion.
   */
  getGenerationResult(providerJobId: string): Promise<ProviderGenerationResult>;

  /**
   * Cancels a queued or generating job on the provider side.
   */
  cancelGeneration(providerJobId: string): Promise<boolean>;

  /**
   * Validates request parameters against provider capability bounds.
   */
  validateRequest(request: ProviderGenerationRequest): boolean;

  /**
   * Estimates raw USD provider cost for accounting and gross margin analysis.
   */
  estimateProviderCost(request: ProviderGenerationRequest): number;

  /**
   * Health check to ping provider API status.
   */
  healthCheck(): Promise<boolean>;
}

export function getUserFriendlyErrorMessage(category: ProviderErrorCategory, defaultMsg?: string): string {
  switch (category) {
    case "RATE_LIMITED":
      return "The AI engine is currently experiencing high demand. Please try again in a few moments.";
    case "MODEL_UNAVAILABLE":
      return "This AI model is temporarily undergoing maintenance. Please select an alternative model.";
    case "INVALID_INPUT":
      return "The prompt or settings provided are incompatible with this model.";
    case "MODERATION_REJECTED":
      return "The request was flagged by safety moderation filters. Please adjust your prompt.";
    case "TIMEOUT":
      return "Generation timed out while waiting for AI compute node response. Credits have been refunded.";
    case "INSUFFICIENT_PROVIDER_BALANCE":
      return "System capacity limit reached. Please contact support if this continues.";
    case "STORAGE_FAILURE":
      return "Failed to transfer video asset to VANTA storage.";
    case "PROVIDER_FAILURE":
    case "UNKNOWN":
    default:
      return defaultMsg || "An unexpected error occurred during AI video synthesis. Credits refunded.";
  }
}
