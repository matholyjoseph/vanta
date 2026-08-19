import { VideoProvider, ProviderError } from "@/lib/video/providers/base-provider";
import { mockVideoProvider } from "@/lib/video/providers/mock-provider";
import { falVideoProvider } from "@/lib/video/providers/fal-provider";
import { geminiImageProvider } from "@/lib/video/providers/gemini-provider";
import { ActorContext } from "@/lib/guest-auth";

export interface ResolveProviderInput {
  actor: ActorContext;
  providerSlug?: string | null;
  modelSlug?: string | null;
}

export function resolveImageProvider(input: ResolveProviderInput): {
  provider: VideoProvider;
  isLiveProvider: boolean;
} {
  const { actor, providerSlug, modelSlug } = input;
  const normalizedProvider = (providerSlug || "").toLowerCase();
  const normalizedModel = (modelSlug || "").toLowerCase();

  // 1. Guests are strictly restricted to Mock Engine
  if (actor.isGuest) {
    if (normalizedProvider === "fal" || normalizedProvider === "gemini" || normalizedModel.includes("imagen")) {
      throw new ProviderError(
        "Guest users are restricted to VANTA Test Mode (Mock Engine). Please sign in with an authorized account to test live providers.",
        "INVALID_INPUT"
      );
    }
    return { provider: mockVideoProvider, isLiveProvider: false };
  }

  // 2. Google Gemini / Imagen 3 Provider Routing
  if (normalizedProvider === "gemini" || normalizedProvider === "google" || normalizedModel.includes("imagen")) {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!geminiKey || geminiKey.trim() === "") {
      throw new ProviderError(
        "Imagen 3 is not configured for live testing. GEMINI_API_KEY is missing in server environment.",
        "MODEL_UNAVAILABLE"
      );
    }
    return { provider: geminiImageProvider, isLiveProvider: true };
  }

  // 3. FAL Provider Routing for Authorized Users
  if (normalizedProvider === "fal") {
    const falKey = process.env.FAL_KEY;
    if (!falKey || falKey.trim() === "") {
      throw new ProviderError(
        "FLUX.1 Schnell is not configured for live testing. FAL_KEY is missing in server environment.",
        "MODEL_UNAVAILABLE"
      );
    }
    return { provider: falVideoProvider, isLiveProvider: true };
  }

  // Default to mock provider
  return { provider: mockVideoProvider, isLiveProvider: false };
}
