import { providerRegistry } from "@/lib/video/providers/provider-registry";
import { mockVideoProvider } from "@/lib/video/providers/mock-provider";

export function resolveImageProvider(params: {
  actor?: any;
  providerSlug?: string | null;
  modelSlug?: string | null;
}) {
  const slug = params.providerSlug || (params.modelSlug?.startsWith("fal") ? "fal" : "vanta-mock");
  const provider = providerRegistry.getProvider(slug) || mockVideoProvider;
  const isLiveProvider = slug === "fal" && Boolean(process.env.FAL_KEY);
  return { provider, isLiveProvider };
}
