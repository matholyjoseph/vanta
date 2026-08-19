import { db } from "@/lib/db";
import { providerRegistry } from "@/lib/video/providers/provider-registry";
import {
  VideoProvider,
  ProviderGenerationRequest,
  ProviderJob,
  ProviderError,
} from "@/lib/video/providers/base-provider";

export interface GenerationRoutingInput {
  userId: string;
  generationId: string;
  modelId: string;
  mode: string;
  prompt: string;
  negativePrompt?: string;
  duration: string;
  resolution: string;
  aspectRatio: string;
  audio?: boolean;
  referenceImages?: string[];
  referenceVideos?: string[];
  outputCount?: number;
}

export class ProviderRouter {
  public async routeAndSubmit(input: GenerationRoutingInput): Promise<{
    job: ProviderJob;
    provider: VideoProvider;
    model: any;
  }> {
    // 1. Resolve Target AIModel and AIProvider from DB
    const model = await db.aIModel.findFirst({
      where: { OR: [{ id: input.modelId }, { slug: input.modelId }] },
      include: { provider: true },
    });

    if (!model) {
      throw new ProviderError(`AI Model '${input.modelId}' not found in registry.`, "INVALID_INPUT");
    }

    if (!model.enabled) {
      throw new ProviderError(
        `AI Model '${model.name}' is currently disabled by administrators.`,
        "MODEL_UNAVAILABLE"
      );
    }

    if (model.provider && model.provider.status === "OFFLINE") {
      throw new ProviderError(
        `AI Provider '${model.provider.name}' is currently offline for maintenance.`,
        "MODEL_UNAVAILABLE"
      );
    }

    // 2. Plan Access Check (PART 22)
    const user = await db.user.findUnique({
      where: { id: input.userId },
      include: { subscription: { include: { plan: true } } },
    });

    if (user) {
      const userPlan = user.subscription?.plan?.key || "FREE";
      const planHierarchy: Record<string, number> = { FREE: 0, CREATOR: 1, PRO: 2, ULTRA: 3 };

      const userRank = planHierarchy[userPlan] ?? 0;
      const requiredRank = planHierarchy[model.requiredPlan] ?? 0;

      if (userRank < requiredRank) {
        throw new ProviderError(
          `ACCESS_DENIED: The model '${model.name}' requires a ${model.requiredPlan} subscription or higher.`,
          "INVALID_INPUT"
        );
      }
    }

    // 3. Capability Validation (PART 34)
    this.validateCapabilities(model, input);

    // 4. Resolve Provider Adapter
    const provider = providerRegistry.getProviderForModel(model.provider?.slug);

    // 5. Build Provider Generation Request
    const providerRequest: ProviderGenerationRequest = {
      generationId: input.generationId,
      userId: input.userId,
      modelId: model.id,
      providerModelId: model.providerModelId || undefined,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      mode: input.mode,
      duration: input.duration,
      resolution: input.resolution,
      aspectRatio: input.aspectRatio,
      audio: input.audio,
      referenceImages: input.referenceImages,
      referenceVideos: input.referenceVideos,
      outputCount: input.outputCount || 1,
    };

    // 6. Submit Generation
    const job = await provider.submitGeneration(providerRequest);

    return { job, provider, model };
  }

  private validateCapabilities(model: any, input: GenerationRoutingInput) {
    let supportedModes: string[] = [];
    let supportedDurations: string[] = [];
    let supportedResolutions: string[] = [];
    let supportedAspectRatios: string[] = [];

    try {
      supportedModes = JSON.parse(model.supportedModes || "[]");
      supportedDurations = JSON.parse(model.supportedDurations || "[]");
      supportedResolutions = JSON.parse(model.supportedResolutions || "[]");
      supportedAspectRatios = JSON.parse(model.supportedAspectRatios || "[]");
    } catch {
      // fallback
    }

    if (supportedModes.length > 0 && !supportedModes.includes(input.mode)) {
      throw new ProviderError(
        `Model '${model.name}' does not support '${input.mode}' mode. Supported: ${supportedModes.join(", ")}`,
        "INVALID_INPUT"
      );
    }

    if (supportedDurations.length > 0 && !supportedDurations.includes(input.duration)) {
      throw new ProviderError(
        `Model '${model.name}' does not support ${input.duration} duration. Supported: ${supportedDurations.join(", ")}`,
        "INVALID_INPUT"
      );
    }

    if (supportedResolutions.length > 0 && !supportedResolutions.includes(input.resolution)) {
      throw new ProviderError(
        `Model '${model.name}' does not support ${input.resolution} resolution. Supported: ${supportedResolutions.join(", ")}`,
        "INVALID_INPUT"
      );
    }

    if (supportedAspectRatios.length > 0 && !supportedAspectRatios.includes(input.aspectRatio)) {
      throw new ProviderError(
        `Model '${model.name}' does not support ${input.aspectRatio} aspect ratio. Supported: ${supportedAspectRatios.join(", ")}`,
        "INVALID_INPUT"
      );
    }

    if (input.audio && !model.supportsAudio) {
      throw new ProviderError(
        `Model '${model.name}' does not support audio generation.`,
        "INVALID_INPUT"
      );
    }
  }
}

export const providerRouter = new ProviderRouter();
