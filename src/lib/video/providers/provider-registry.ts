import { VideoProvider } from "@/lib/video/providers/base-provider";
import { mockVideoProvider } from "@/lib/video/providers/mock-provider";
import { falVideoProvider } from "@/lib/video/providers/fal-provider";
import { geminiImageProvider } from "@/lib/video/providers/gemini-provider";
import { googleVideoProvider } from "@/lib/video/providers/google-video-provider";

class ProviderRegistry {
  private providers = new Map<string, VideoProvider>();

  constructor() {
    this.register(mockVideoProvider);
    this.register(falVideoProvider);
    this.register(geminiImageProvider);
    this.register(googleVideoProvider);
  }

  public register(provider: VideoProvider): void {
    this.providers.set(provider.slug.toLowerCase(), provider);
  }

  public getProvider(slug: string): VideoProvider {
    const normSlug = slug.toLowerCase();
    const provider = this.providers.get(normSlug);
    if (provider) return provider;
    if (normSlug === "google" || normSlug === "gemini") return googleVideoProvider;
    return mockVideoProvider;
  }

  public getProviderForModel(providerSlug?: string | null): VideoProvider {
    if (!providerSlug) return mockVideoProvider;
    return this.getProvider(providerSlug);
  }
}

export const providerRegistry = new ProviderRegistry();

export function getProvider(slug: string): VideoProvider {
  return providerRegistry.getProvider(slug);
}
