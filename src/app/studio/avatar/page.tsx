import * as React from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getAvatarModelsAction, getUserAssetOptionsAction } from "@/app/actions/avatar-actions";
import { AvatarStudioWorkspace } from "@/components/studio/avatar-studio-workspace";
import { ToastProvider } from "@/components/ui/toast";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Talking Avatar & Lip Sync Studio — VANTA AI",
  description: "Synchronize mouth movement and facial gestures for photorealistic talking characters.",
};

export default async function AvatarStudioPage() {
  const user = await getAuthenticatedOrGuestUser();

  let models: any[] = [];
  let userAssets: any = { imageAssets: [], videoAssets: [], audioAssets: [], characters: [] };
  let initialGenerations: any[] = [];

  try {
    const [fetchedModels, fetchedAssets, fetchedGens] = await Promise.all([
      getAvatarModelsAction(),
      getUserAssetOptionsAction(),
      db.generation.findMany({
        where: {
          userId: user.id,
          mode: { in: ["talking-avatar", "lip-sync"] },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
    models = fetchedModels;
    userAssets = fetchedAssets;
    initialGenerations = fetchedGens;
  } catch (err) {
    console.warn("[AvatarStudioPage] DB read fallback:", err);
  }

  return (
    <ToastProvider>
      <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
        <AvatarStudioWorkspace
          initialModels={models as any}
          userAssets={userAssets as any}
          initialGenerations={initialGenerations as any}
        />
      </div>
    </ToastProvider>
  );
}
