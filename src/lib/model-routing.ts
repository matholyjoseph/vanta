import { AI_MODELS_REGISTRY, getModelConfig, type AIModelConfig } from "@/lib/models-config";
import { MODELS, type ModelInfo } from "@/lib/constants";

export interface ModelRouteInput {
  id?: string;
  slug?: string;
  name?: string;
  mediaType?: string;
  type?: string;
}

export function getModelStudioUrl(model: ModelRouteInput): string {
  const rawSlug = model.slug || model.id || (model.name ? model.name.toLowerCase().replace(/\s+/g, "-") : "nova-video-pro");
  const mediaType = (model.mediaType || model.type || "VIDEO").toUpperCase();

  switch (mediaType) {
    case "IMAGE":
      return `/studio/image?model=${encodeURIComponent(rawSlug)}`;
    case "AUDIO":
      return `/studio/audio?model=${encodeURIComponent(rawSlug)}`;
    case "AVATAR":
      return `/studio/avatar?model=${encodeURIComponent(rawSlug)}`;
    case "VIDEO":
    default:
      return `/studio/video?model=${encodeURIComponent(rawSlug)}`;
  }
}

export function getStudioForMediaType(mediaType: string): string {
  switch (mediaType.toUpperCase()) {
    case "IMAGE":
      return "/studio/image";
    case "AUDIO":
      return "/studio/audio";
    case "AVATAR":
      return "/studio/avatar";
    case "VIDEO":
    default:
      return "/studio/video";
  }
}

export function resolveModelFromSlug(slug: string): { found: boolean; model: ModelInfo | AIModelConfig } {
  const normalizedSlug = slug.toLowerCase().trim();

  // Search constants MODELS
  const constantMatch = MODELS.find(
    (m) => m.id === normalizedSlug || m.name.toLowerCase().replace(/\s+/g, "-") === normalizedSlug
  );
  if (constantMatch) {
    return { found: true, model: constantMatch };
  }

  // Search AI_MODELS_REGISTRY
  const registryMatch = AI_MODELS_REGISTRY.find(
    (m) => m.id === normalizedSlug || m.name.toLowerCase().replace(/\s+/g, "-") === normalizedSlug
  );
  if (registryMatch) {
    return { found: true, model: registryMatch };
  }

  // Default fallback to Nova Video Pro
  return { found: false, model: MODELS[0] };
}
