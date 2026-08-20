import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const DEFAULT_VIDEO_MODELS = [
  {
    id: "vanta-motion-fast",
    slug: "vanta-motion-fast",
    name: "Vanta Motion Fast",
    type: "VIDEO",
    description: "Ultra-fast generation engine optimized for rapid prototyping & social content.",
    creditCost: 8,
    isDefault: true,
    enabled: true,
    isNew: false,
    isPopular: true,
    requiredPlan: "FREE",
    speedTier: "Fast",
    priority: 10,
    supportedModes: ["text-to-video", "image-to-video"],
    supportedDurations: ["5s", "10s"],
    supportedResolutions: ["720p", "1080p"],
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportsAudio: false,
    supportsImageReference: true,
    supportsVideoReference: false,
    supportsStartEndFrame: false,
    supportsMotionControl: false,
    pricingRules: { "5s_720p": 8, "5s_1080p": 12, "10s_720p": 15, "10s_1080p": 22 },
    isFavorite: false,
    isRecent: false,
  },
  {
    id: "gemini-omni-flash",
    slug: "gemini-omni-flash",
    name: "Gemini Omni Flash",
    type: "VIDEO",
    description: "Fast multimodal video synthesis powered by Google Gemini AI.",
    creditCost: 6,
    isDefault: false,
    enabled: true,
    isNew: true,
    isPopular: true,
    isFeatured: true,
    requiredPlan: "FREE",
    speedTier: "Fast",
    priority: 15,
    supportedModes: ["text-to-video", "image-to-video"],
    supportedDurations: ["4s", "6s", "8s"],
    supportedResolutions: ["720p", "1080p"],
    supportedAspectRatios: ["16:9", "9:16"],
    supportsAudio: false,
    supportsImageReference: true,
    supportsVideoReference: false,
    supportsStartEndFrame: false,
    supportsMotionControl: false,
    pricingRules: { "4s_720p": 6, "6s_720p": 9, "8s_1080p": 12 },
    isFavorite: false,
    isRecent: false,
  },
  {
    id: "veo-3-1",
    slug: "veo-3-1",
    name: "Veo 3.1 Cinematic",
    type: "VIDEO",
    description: "Google's flagship cinematic video model with native audio synthesis.",
    creditCost: 15,
    isDefault: false,
    enabled: true,
    isNew: true,
    isPopular: true,
    isFeatured: true,
    requiredPlan: "FREE",
    speedTier: "Quality",
    priority: 14,
    supportedModes: ["text-to-video", "image-to-video", "video-to-video"],
    supportedDurations: ["5s", "10s"],
    supportedResolutions: ["1080p", "4K"],
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportsAudio: true,
    supportsImageReference: true,
    supportsVideoReference: true,
    supportsStartEndFrame: true,
    supportsMotionControl: true,
    pricingRules: { "5s_1080p": 15, "10s_1080p": 25, "5s_4K": 30 },
    isFavorite: false,
    isRecent: false,
  },
];

const DEFAULT_IMAGE_MODELS = [
  {
    id: "vanta-flux-pro",
    slug: "vanta-flux-pro",
    name: "Flux Pro v1.1",
    type: "IMAGE",
    description: "Next-generation photorealistic image synthesis with state-of-the-art prompt fidelity.",
    creditCost: 10,
    isFeatured: true,
    isDefault: true,
    enabled: true,
    speedTier: "Fast",
    supportedModes: ["text-to-image", "image-to-image"],
    supportedResolutions: ["1024x1024", "1920x1080", "1080x1920"],
    supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3"],
    isFavorite: false,
    isRecent: false,
  },
  {
    id: "vanta-aura-sdxl",
    slug: "vanta-aura-sdxl",
    name: "Aura SDXL Turbo",
    type: "IMAGE",
    description: "Ultra-fast high-definition generation engineered for rapid creative exploration.",
    creditCost: 5,
    isFeatured: false,
    isDefault: false,
    enabled: true,
    speedTier: "Fast",
    supportedModes: ["text-to-image", "inpainting"],
    supportedResolutions: ["1024x1024", "1280x720"],
    supportedAspectRatios: ["1:1", "16:9", "9:16"],
    isFavorite: false,
    isRecent: false,
  },
];

export async function GET(request: NextRequest) {
  const requestedType = request.nextUrl.searchParams.get("type")?.toUpperCase() || "VIDEO";

  try {
    let session = null;
    try {
      session = await auth();
    } catch {}
    const userId = session?.user?.id;

    let models: any[] = [];
    try {
      models = await db.aIModel.findMany({
        where: {
          type: requestedType,
          enabled: true,
        },
        include: { provider: true },
        orderBy: [{ isDefault: "desc" }, { priority: "desc" }],
      });
    } catch (dbErr) {
      console.warn("[GET /api/models] DB read warning:", dbErr);
    }

    if (models.length === 0) {
      if (requestedType === "IMAGE") {
        return NextResponse.json({ models: DEFAULT_IMAGE_MODELS });
      }
      return NextResponse.json({ models: DEFAULT_VIDEO_MODELS });
    }

    let favoriteModelIds: string[] = [];
    let recentModelIds: string[] = [];

    if (userId) {
      try {
        const favorites = await db.userFavoriteModel.findMany({
          where: { userId },
          select: { modelId: true },
        });
        favoriteModelIds = favorites.map((f) => f.modelId);

        const pref = await db.userPreference.findUnique({
          where: { userId },
          select: { recentModelIds: true },
        });
        if (pref?.recentModelIds) {
          try {
            recentModelIds = JSON.parse(pref.recentModelIds);
          } catch {
            recentModelIds = [];
          }
        }
      } catch {}
    }

    const parsedModels = models.map((m) => ({
      ...m,
      speedTier: m.speedTier || "Balanced",
      supportedModes: typeof m.supportedModes === "string" ? JSON.parse(m.supportedModes) : m.supportedModes,
      supportedDurations: typeof m.supportedDurations === "string" ? JSON.parse(m.supportedDurations) : m.supportedDurations,
      supportedResolutions: typeof m.supportedResolutions === "string" ? JSON.parse(m.supportedResolutions) : m.supportedResolutions,
      supportedAspectRatios: typeof m.supportedAspectRatios === "string" ? JSON.parse(m.supportedAspectRatios) : m.supportedAspectRatios,
      pricingRules: typeof m.pricingRules === "string" ? JSON.parse(m.pricingRules) : m.pricingRules,
      isFavorite: favoriteModelIds.includes(m.id),
      isRecent: recentModelIds.includes(m.id),
    }));

    return NextResponse.json({ models: parsedModels });
  } catch {
    if (requestedType === "IMAGE") {
      return NextResponse.json({ models: DEFAULT_IMAGE_MODELS });
    }
    return NextResponse.json({ models: DEFAULT_VIDEO_MODELS });
  }
}
