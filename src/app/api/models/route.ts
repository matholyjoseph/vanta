import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const requestedType = request.nextUrl.searchParams.get("type")?.toUpperCase() || "VIDEO";

    const models = await db.aIModel.findMany({
      where: {
        type: requestedType,
        enabled: true,
      },
      include: { provider: true },
      orderBy: [{ isDefault: "desc" }, { priority: "desc" }],
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
    return NextResponse.json({ error: "Failed to fetch AI models" }, { status: 500 });
  }
}
