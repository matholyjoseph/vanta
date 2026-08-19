import {
  VideoProvider,
  ProviderError,
  ProviderGenerationRequest,
  ProviderJob,
  ProviderGenerationStatus,
  ProviderGenerationResult,
  getUserFriendlyErrorMessage,
} from "@/lib/video/providers/base-provider";

export class FalVideoProvider implements VideoProvider {
  public slug = "fal";
  public name = "fal.ai Video Engine";

  private getApiKey(): string {
    const key = process.env.FAL_KEY;
    if (!key || key.trim() === "") {
      throw new ProviderError(
        "fal.ai API credentials (FAL_KEY) are not configured in server environment.",
        "MODEL_UNAVAILABLE"
      );
    }
    return key.trim();
  }

  // Model-specific payload transformer
  private transformInput(input: ProviderGenerationRequest, modelId: string) {
    const prompt = input.prompt;
    const aspectRatio = input.aspectRatio || "16:9";

    if (modelId.includes("minimax")) {
      return {
        prompt,
        prompt_optimizer: true,
        aspect_ratio: aspectRatio,
      };
    }

    if (modelId.includes("hunyuan")) {
      return {
        prompt,
        aspect_ratio: aspectRatio === "9:16" ? "9:16" : "16:9",
        num_frames: input.duration === "10s" ? 240 : 129,
        resolution: input.resolution === "720p" ? "720p" : "1080p",
      };
    }

    return {
      prompt,
      aspect_ratio: aspectRatio,
      loop: false,
    };
  }

  async submitGeneration(request: ProviderGenerationRequest): Promise<ProviderJob> {
    const apiKey = this.getApiKey();
    const modelId = request.providerModelId || "fal-ai/luma-dream-machine";

    const payload = this.transformInput(request, modelId);

    try {
      const response = await fetch(`https://queue.fal.run/${modelId}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new ProviderError(getUserFriendlyErrorMessage("RATE_LIMITED"), "RATE_LIMITED", errorText);
        }
        if (response.status === 400 || response.status === 422) {
          if (errorText.toLowerCase().includes("safety") || errorText.toLowerCase().includes("nsfw")) {
            throw new ProviderError(getUserFriendlyErrorMessage("MODERATION_REJECTED"), "MODERATION_REJECTED", errorText);
          }
          throw new ProviderError(getUserFriendlyErrorMessage("INVALID_INPUT"), "INVALID_INPUT", errorText);
        }
        if (response.status >= 500) {
          throw new ProviderError(getUserFriendlyErrorMessage("MODEL_UNAVAILABLE"), "MODEL_UNAVAILABLE", errorText);
        }
        throw new ProviderError(`fal.ai submit error (${response.status}): ${errorText}`, "PROVIDER_FAILURE");
      }

      const data = await response.json();
      const requestId = data.request_id;

      if (!requestId) {
        throw new ProviderError("fal.ai did not return a valid request_id.", "PROVIDER_FAILURE");
      }

      const encodedJobId = `${modelId}::${requestId}`;

      return {
        providerJobId: encodedJobId,
        providerName: this.name,
        status: "SUBMITTED",
        progress: 10,
        estimatedTimeSeconds: 30,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError("Failed to connect to fal.ai API endpoint.", "PROVIDER_FAILURE", err);
    }
  }

  async getGenerationStatus(encodedJobId: string): Promise<ProviderGenerationStatus> {
    const apiKey = this.getApiKey();

    let modelId = "fal-ai/luma-dream-machine";
    let requestId = encodedJobId;

    if (encodedJobId.includes("::")) {
      const parts = encodedJobId.split("::");
      modelId = parts[0];
      requestId = parts[1];
    }

    try {
      const statusRes = await fetch(`https://queue.fal.run/${modelId}/requests/${requestId}/status`, {
        headers: { Authorization: `Key ${apiKey}` },
      });

      if (!statusRes.ok) {
        if (statusRes.status === 404) {
          return {
            providerJobId: encodedJobId,
            status: "FAILED",
            progress: 0,
            errorMessage: "Job request expired or not found on fal.ai queue.",
            errorCategory: "PROVIDER_FAILURE",
          };
        }
        throw new ProviderError(`Status fetch failed (${statusRes.status})`, "PROVIDER_FAILURE");
      }

      const statusData = await statusRes.json();
      const falStatus = statusData.status;

      let status: ProviderGenerationStatus["status"] = "GENERATING";
      let progress = 30;

      if (falStatus === "IN_QUEUE") {
        status = "QUEUED";
        progress = 15;
      } else if (falStatus === "IN_PROGRESS") {
        status = "GENERATING";
        const logs = statusData.logs || [];
        progress = Math.min(85, 30 + logs.length * 10);
      } else if (falStatus === "COMPLETED") {
        const resultRes = await fetch(`https://queue.fal.run/${modelId}/requests/${requestId}`, {
          headers: { Authorization: `Key ${apiKey}` },
        });

        if (resultRes.ok) {
          const resultData = await resultRes.json();
          const mediaObj =
            resultData.images?.[0] ||
            resultData.image ||
            resultData.video ||
            resultData.videos?.[0] ||
            resultData.output;

          const mediaUrl = typeof mediaObj === "string" ? mediaObj : mediaObj?.url;
          const thumbnailUrl = mediaObj?.thumbnail_url || mediaObj?.preview_url || mediaUrl;

          if (mediaUrl) {
            return {
              providerJobId: encodedJobId,
              status: "COMPLETED",
              progress: 100,
              videoUrl: mediaUrl,
              thumbnailUrl,
            };
          }
        }

        return {
          providerJobId: encodedJobId,
          status: "FAILED",
          progress: 0,
          errorMessage: "Completed fal.ai job returned no valid video URL.",
          errorCategory: "PROVIDER_FAILURE",
        };
      }

      return {
        providerJobId: encodedJobId,
        status,
        progress,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      return {
        providerJobId: encodedJobId,
        status: "FAILED",
        progress: 0,
        errorMessage: err instanceof Error ? err.message : "Failed to query fal.ai status.",
        errorCategory: "UNKNOWN",
      };
    }
  }

  async getGenerationResult(encodedJobId: string): Promise<ProviderGenerationResult> {
    const status = await this.getGenerationStatus(encodedJobId);
    return {
      providerJobId: encodedJobId,
      status: status.status,
      videoUrl: status.videoUrl,
      thumbnailUrl: status.thumbnailUrl,
      providerCostEstimate: 0.05,
    };
  }

  async cancelGeneration(encodedJobId: string): Promise<boolean> {
    try {
      const apiKey = this.getApiKey();
      let modelId = "fal-ai/luma-dream-machine";
      let requestId = encodedJobId;

      if (encodedJobId.includes("::")) {
        const parts = encodedJobId.split("::");
        modelId = parts[0];
        requestId = parts[1];
      }

      const res = await fetch(`https://queue.fal.run/${modelId}/requests/${requestId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Key ${apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  validateRequest(request: ProviderGenerationRequest): boolean {
    return !!request.prompt && request.prompt.length >= 3;
  }

  estimateProviderCost(request: ProviderGenerationRequest): number {
    return 0.05;
  }

  async healthCheck(): Promise<boolean> {
    return !!process.env.FAL_KEY;
  }
}

export const falVideoProvider = new FalVideoProvider();
