import {
  VideoProvider,
  ProviderGenerationRequest,
  ProviderJob,
  ProviderGenerationStatus,
  ProviderGenerationResult,
} from "@/lib/video/providers/base-provider";

interface MockJobState {
  providerJobId: string;
  request: ProviderGenerationRequest;
  startTime: number;
  cancelled: boolean;
}

const mockJobsStore = new Map<string, MockJobState>();

export function generateMockUrlForPrompt(prompt: string, jobId: string): string {
  const lower = (prompt || "").toLowerCase();

  if (lower.includes("wolf") || lower.includes("werewolf")) {
    return "/werewolf_cinematic_preview.jpg";
  }

  let categoryLabel = "CONCEPT ART";
  let bgGradient = "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)";
  let iconEmoji = "🎨";

  if (lower.includes("cat") || lower.includes("kitten") || lower.includes("feline")) {
    categoryLabel = "DOMESTIC CAT";
    bgGradient = "linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)";
    iconEmoji = "🐱";
  } else if (lower.includes("car") || lower.includes("vehicle") || lower.includes("auto") || lower.includes("sports")) {
    categoryLabel = "AUTOMOTIVE";
    bgGradient = "linear-gradient(135deg, #881337 0%, #9f1239 50%, #e11d48 100%)";
    iconEmoji = "🏎️";
  } else if (lower.includes("strawberry") || lower.includes("strawberries") || lower.includes("fruit") || lower.includes("food")) {
    categoryLabel = "STILL LIFE";
    bgGradient = "linear-gradient(135deg, #831843 0%, #9d174d 50%, #db2777 100%)";
    iconEmoji = "🍓";
  } else if (lower.includes("space") || lower.includes("galaxy") || lower.includes("star") || lower.includes("planet")) {
    categoryLabel = "COSMIC SCENE";
    bgGradient = "linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #311042 100%)";
    iconEmoji = "🌌";
  } else if (lower.includes("portrait") || lower.includes("face") || lower.includes("person") || lower.includes("man") || lower.includes("woman")) {
    categoryLabel = "PORTRAIT";
    bgGradient = "linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #14b8a6 100%)";
    iconEmoji = "👤";
  }

  const cleanPrompt = prompt.replace(/"/g, "&quot;").substring(0, 80);
  const seedTag = jobId.substring(jobId.length - 4);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient.split(" ")[1]}" />
        <stop offset="50%" stop-color="${bgGradient.split(" ")[3]}" />
        <stop offset="100%" stop-color="${bgGradient.split(" ")[5]}" />
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#bg)" />
    <circle cx="640" cy="280" r="140" fill="rgba(255,255,255,0.06)" />
    <text x="640" y="300" font-family="sans-serif" font-size="100" text-anchor="middle">${iconEmoji}</text>
    <rect x="500" y="380" width="280" height="32" rx="16" fill="rgba(200,255,0,0.15)" stroke="#c8ff00" stroke-width="1.5" />
    <text x="640" y="401" font-family="monospace" font-size="13" font-weight="bold" fill="#c8ff00" text-anchor="middle" letter-spacing="2">VANTA MOCK · ${categoryLabel}</text>
    <text x="640" y="470" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">"${cleanPrompt}"</text>
    <text x="640" y="510" font-family="monospace" font-size="14" fill="#a1a1aa" text-anchor="middle">SEED: #${seedTag} · RESOLUTION: 1280x720 · TEST MODE</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export class MockVideoProvider implements VideoProvider {
  public slug = "vanta-mock";
  public name = "Vanta AI Native Engine (Development Mock)";

  async submitGeneration(request: ProviderGenerationRequest): Promise<ProviderJob> {
    const providerJobId = `job-mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const jobState: MockJobState = {
      providerJobId,
      request,
      startTime: Date.now(),
      cancelled: false,
    };

    mockJobsStore.set(providerJobId, jobState);

    return {
      providerJobId,
      providerName: this.name,
      status: "QUEUED",
      progress: 0,
    };
  }

  async getGenerationStatus(providerJobId: string): Promise<ProviderGenerationStatus> {
    const job = mockJobsStore.get(providerJobId);
    if (!job) {
      return {
        providerJobId,
        status: "FAILED",
        progress: 0,
        errorMessage: "Job not found on provider",
        errorCategory: "INVALID_INPUT",
      };
    }

    if (job.cancelled) {
      return {
        providerJobId,
        status: "CANCELLED",
        progress: 0,
        errorMessage: "Generation request cancelled by user",
      };
    }

    const elapsedSeconds = (Date.now() - job.startTime) / 1000;
    const isSimulatedFailure = job.request.prompt.toLowerCase().includes("[fail]");

    if (isSimulatedFailure && elapsedSeconds >= 4) {
      return {
        providerJobId,
        status: "FAILED",
        progress: 35,
        errorMessage: "AI Generation failed: Model safety moderation rejected or resource timeout.",
        errorCategory: "MODERATION_REJECTED",
      };
    }

    let status: ProviderGenerationStatus["status"] = "QUEUED";
    let progress = 0;

    if (elapsedSeconds < 2) {
      status = "QUEUED";
      progress = 0;
    } else if (elapsedSeconds < 4) {
      status = "SUBMITTED";
      progress = 10;
    } else if (elapsedSeconds < 7) {
      status = "GENERATING";
      progress = 25;
    } else if (elapsedSeconds < 11) {
      status = "GENERATING";
      progress = 45;
    } else if (elapsedSeconds < 14) {
      status = "GENERATING";
      progress = 70;
    } else if (elapsedSeconds < 17) {
      status = "PROCESSING";
      progress = 90;
    } else {
      status = "COMPLETED";
      progress = 100;
    }

    if (status === "COMPLETED") {
      const isImage = job.request.mode?.includes("image") && !job.request.mode?.includes("video");
      const outputUrl = isImage
        ? generateMockUrlForPrompt(job.request.prompt, providerJobId)
        : "/uploads/samples/vanta-sample-video.mp4";

      return {
        providerJobId,
        status: "COMPLETED",
        progress: 100,
        videoUrl: outputUrl,
        thumbnailUrl: isImage ? outputUrl : undefined,
      };
    }

    return {
      providerJobId,
      status,
      progress,
    };
  }

  async getGenerationResult(providerJobId: string): Promise<ProviderGenerationResult> {
    const status = await this.getGenerationStatus(providerJobId);
    const outputUrl = status.videoUrl || "/uploads/samples/vanta-sample-video.mp4";
    return {
      providerJobId,
      status: status.status,
      videoUrl: outputUrl,
      thumbnailUrl: outputUrl,
      providerCostEstimate: 0.02,
    };
  }

  async cancelGeneration(providerJobId: string): Promise<boolean> {
    const job = mockJobsStore.get(providerJobId);
    if (job) {
      job.cancelled = true;
      return true;
    }
    return false;
  }

  validateRequest(request: ProviderGenerationRequest): boolean {
    return !!request.prompt && request.prompt.length >= 3;
  }

  estimateProviderCost(request: ProviderGenerationRequest): number {
    return request.resolution === "4K" ? 0.08 : 0.02;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

export const mockVideoProvider = new MockVideoProvider();
