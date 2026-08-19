import * as React from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getImageModelsAction } from "@/app/actions/image-actions";
import { ImageStudioWorkspace } from "@/components/studio/image-studio-workspace";
import { ToastProvider } from "@/components/ui/toast";
import { getActorContext } from "@/lib/guest-auth";

export const metadata: Metadata = {
  title: "Multi-Model AI Image Studio — VANTA AI",
  description: "Create, edit, inpaint, outpaint, and generate product photography with AI.",
};

export default async function ImageStudioPage() {
  const actor = await getActorContext();

  const [models, initialGenerations] = await Promise.all([
    getImageModelsAction(),
    db.generation.findMany({
      where: {
        OR: [
          actor.userId ? { userId: actor.userId } : {},
          actor.guestSessionId ? { guestSessionId: actor.guestSessionId } : {},
        ],
        mediaType: "IMAGE",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <ToastProvider>
      <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
        <ImageStudioWorkspace initialModels={models as any} initialGenerations={initialGenerations as any} />
      </div>
    </ToastProvider>
  );
}
