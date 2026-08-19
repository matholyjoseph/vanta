import { db } from "@/lib/db";

export interface ModelSelectionCriteria {
  type: "IMAGE" | "VIDEO" | "AUDIO" | "AVATAR";
  mode?: string;
  qualityPreference?: "ECONOMY" | "BALANCED" | "PREMIUM";
  userPlan?: string;
  requiredResolution?: string;
  requiresAudio?: boolean;
  requiresImageReference?: boolean;
}

export async function selectOptimalModel(criteria: ModelSelectionCriteria) {
  const {
    type,
    qualityPreference = "BALANCED",
    userPlan = "FREE",
  } = criteria;

  const models = await db.aIModel.findMany({
    where: {
      type,
      enabled: true,
    },
    orderBy: [
      { priority: "desc" },
      { creditCost: qualityPreference === "ECONOMY" ? "asc" : "desc" },
    ],
  });

  if (models.length === 0) {
    // Fallback default slug strings if DB models are empty
    if (type === "IMAGE") return "fal-flux-schnell";
    if (type === "AUDIO") return "fal-mmaudio";
    if (type === "AVATAR") return "fal-latentsync";
    return "vanta-motion-fast";
  }

  // Rank models based on quality preference and required plan
  const planHierarchy: Record<string, number> = { FREE: 0, CREATOR: 1, PRO: 2, ULTRA: 3 };
  const userRank = planHierarchy[userPlan] ?? 0;

  const eligibleModels = models.filter((m) => {
    const requiredRank = planHierarchy[m.requiredPlan] ?? 0;
    return userRank >= requiredRank;
  });

  const pool = eligibleModels.length > 0 ? eligibleModels : models;

  if (qualityPreference === "ECONOMY") {
    // Pick lowest credit cost
    const sorted = [...pool].sort((a, b) => a.creditCost - b.creditCost);
    return sorted[0].slug;
  }

  if (qualityPreference === "PREMIUM") {
    // Pick highest priority / featured model
    const featured = pool.find((m) => m.isFeatured || m.isPopular);
    if (featured) return featured.slug;
  }

  // Default BALANCED: Pick first default or first available model
  const defaultModel = pool.find((m) => m.isDefault);
  return defaultModel ? defaultModel.slug : pool[0].slug;
}

export async function resolveAllDirectorModels(qualityPreference: "ECONOMY" | "BALANCED" | "PREMIUM", userPlan: string) {
  const [imageModel, videoModel, audioModel, avatarModel] = await Promise.all([
    selectOptimalModel({ type: "IMAGE", qualityPreference, userPlan }),
    selectOptimalModel({ type: "VIDEO", qualityPreference, userPlan }),
    selectOptimalModel({ type: "AUDIO", qualityPreference, userPlan }),
    selectOptimalModel({ type: "AVATAR", qualityPreference, userPlan }),
  ]);

  return {
    imageModel,
    videoModel,
    audioModel,
    avatarModel,
  };
}
