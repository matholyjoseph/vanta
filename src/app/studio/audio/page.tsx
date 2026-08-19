import * as React from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getAudioModelsAction, getUserFavoriteVoicesAction } from "@/app/actions/audio-actions";
import { AudioStudioWorkspace } from "@/components/studio/audio-studio-workspace";
import { ToastProvider } from "@/components/ui/toast";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

export const metadata: Metadata = {
  title: "Multi-Model AI Audio Studio — VANTA AI",
  description: "Synthesize natural text-to-speech voiceovers, AI sound effects and cinematic film scores.",
};

export default async function AudioStudioPage() {
  const user = await getAuthenticatedOrGuestUser();

  const [models, userFavoriteVoices, initialGenerations] = await Promise.all([
    getAudioModelsAction(),
    getUserFavoriteVoicesAction(),
    db.generation.findMany({
      where: { userId: user.id, mediaType: "AUDIO" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <ToastProvider>
      <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
        <AudioStudioWorkspace
          initialModels={models as any}
          initialGenerations={initialGenerations as any}
          userFavoriteVoices={userFavoriteVoices}
        />
      </div>
    </ToastProvider>
  );
}
