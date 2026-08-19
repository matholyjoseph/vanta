export interface ModelCapability {
  textToVideo: boolean;
  imageToVideo: boolean;
  videoToVideo: boolean;
  motionControl: boolean;
  startEndFrame: boolean;
  audioGeneration: boolean;
  resolutions: string[];
  durations: string[];
  aspectRatios: string[];
  maxOutputs: number;
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  description: string;
  baseCreditCost: number;
  isDefault?: boolean;
  capabilities: ModelCapability;
}

export const AI_MODELS_REGISTRY: AIModelConfig[] = [
  {
    id: "vanta-v2-cinema",
    name: "Vanta-v2-Cinema",
    provider: "VANTA",
    description: "Flagship photorealistic multi-model engine with 4K UHD support and precision motion control.",
    baseCreditCost: 5,
    isDefault: true,
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      videoToVideo: true,
      motionControl: true,
      startEndFrame: true,
      audioGeneration: true,
      resolutions: ["1920x1080", "3840x2160"],
      durations: ["00:04", "00:08", "00:12", "00:16"],
      aspectRatios: ["16:9", "9:16", "21:9", "1:1"],
      maxOutputs: 4,
    },
  },
  {
    id: "nova-video-pro",
    name: "Nova Video Pro",
    provider: "NOVA",
    description: "High-fidelity cinematic model optimized for ultra-detailed textures and lighting simulation.",
    baseCreditCost: 10,
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      videoToVideo: false,
      motionControl: true,
      startEndFrame: true,
      audioGeneration: true,
      resolutions: ["1920x1080", "3840x2160"],
      durations: ["00:04", "00:08", "00:16"],
      aspectRatios: ["16:9", "9:16", "1:1"],
      maxOutputs: 2,
    },
  },
  {
    id: "motion-x",
    name: "Motion X",
    provider: "MOTION_LABS",
    description: "Advanced camera trajectory & fluid dynamics synthesis engine for complex physics.",
    baseCreditCost: 8,
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      videoToVideo: true,
      motionControl: true,
      startEndFrame: false,
      audioGeneration: false,
      resolutions: ["1280x720", "1920x1080"],
      durations: ["00:04", "00:08", "00:12"],
      aspectRatios: ["16:9", "9:16", "21:9"],
      maxOutputs: 2,
    },
  },
  {
    id: "curator",
    name: "Curator",
    provider: "ARTISAN",
    description: "Artistic style transfer and visual effects model for stylized film sequences.",
    baseCreditCost: 6,
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      videoToVideo: true,
      motionControl: false,
      startEndFrame: false,
      audioGeneration: true,
      resolutions: ["1920x1080"],
      durations: ["00:04", "00:08"],
      aspectRatios: ["16:9", "1:1"],
      maxOutputs: 2,
    },
  },
  {
    id: "flash-video",
    name: "Flash Video",
    provider: "VANTA",
    description: "Ultra-fast generation engine for rapid storyboard prototyping and previews.",
    baseCreditCost: 2,
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      videoToVideo: false,
      motionControl: false,
      startEndFrame: false,
      audioGeneration: false,
      resolutions: ["1280x720", "1920x1080"],
      durations: ["00:04"],
      aspectRatios: ["16:9", "9:16"],
      maxOutputs: 4,
    },
  },
];

export function getModelConfig(modelId: string): AIModelConfig {
  const model = AI_MODELS_REGISTRY.find((m) => m.id === modelId || m.name === modelId);
  return model || AI_MODELS_REGISTRY[0];
}

export function calculateCreditCostServer(
  modelId: string,
  resolution: string,
  duration: string
): number {
  const model = getModelConfig(modelId);
  let cost = model.baseCreditCost;

  if (resolution === "3840x2160") {
    cost += 5;
  }
  if (duration === "00:08") {
    cost += 3;
  } else if (duration === "00:12") {
    cost += 6;
  } else if (duration === "00:16") {
    cost += 10;
  }

  return cost;
}
