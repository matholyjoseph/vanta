"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getStudioModelsAction(mediaType: "VIDEO" | "IMAGE" | "AUDIO" | "AVATAR" = "VIDEO") {
  const session = await auth();
  const userId = session?.user?.id;

  const models = await db.aIModel.findMany({
    where: { type: mediaType, enabled: true },
    orderBy: [{ isFeatured: "desc" }, { priority: "desc" }, { name: "asc" }],
    include: { provider: true },
  });

  let favoriteModelIds: string[] = [];
  let recentModelIds: string[] = [];

  if (userId) {
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
  }

  const parsedModels = models.map((model) => {
    let modes: string[] = [];
    let durations: string[] = [];
    let resolutions: string[] = [];
    let aspectRatios: string[] = [];

    try { modes = JSON.parse(model.supportedModes || "[]"); } catch { modes = ["text-to-video"]; }
    try { durations = JSON.parse(model.supportedDurations || "[]"); } catch { durations = ["5s"]; }
    try { resolutions = JSON.parse(model.supportedResolutions || "[]"); } catch { resolutions = ["1080p"]; }
    try { aspectRatios = JSON.parse(model.supportedAspectRatios || "[]"); } catch { aspectRatios = ["16:9"]; }

    return {
      ...model,
      supportedModes: modes,
      supportedDurations: durations,
      supportedResolutions: resolutions,
      supportedAspectRatios: aspectRatios,
      isFavorite: favoriteModelIds.includes(model.id),
      isRecent: recentModelIds.includes(model.id),
    };
  });

  return { models: parsedModels, favoriteModelIds, recentModelIds };
}

export async function toggleUserFavoriteModelAction(modelId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required to favorite models.");
  }

  const userId = session.user.id;
  const existing = await db.userFavoriteModel.findUnique({
    where: { userId_modelId: { userId, modelId } },
  });

  if (existing) {
    await db.userFavoriteModel.delete({
      where: { id: existing.id },
    });
    revalidatePath("/studio/video");
    return { isFavorite: false };
  } else {
    await db.userFavoriteModel.create({
      data: { userId, modelId },
    });
    revalidatePath("/studio/video");
    return { isFavorite: true };
  }
}

export async function updateUserRecentModelsAction(modelId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const userId = session.user.id;
  let pref = await db.userPreference.findUnique({ where: { userId } });

  let recentList: string[] = [];
  if (pref?.recentModelIds) {
    try {
      recentList = JSON.parse(pref.recentModelIds);
    } catch {
      recentList = [];
    }
  }

  // Deduplicate and keep top 5 recent models
  recentList = [modelId, ...recentList.filter((id) => id !== modelId)].slice(0, 5);

  await db.userPreference.upsert({
    where: { userId },
    update: { recentModelIds: JSON.stringify(recentList) },
    create: { userId, recentModelIds: JSON.stringify(recentList) },
  });
}
