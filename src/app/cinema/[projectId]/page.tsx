import * as React from "react";
import type { Metadata } from "next";
import { getCinemaProjectDetailsAction } from "@/app/actions/cinema-actions";
import { CinemaStudioWorkspace } from "@/components/cinema/cinema-studio-workspace";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Cinema Studio Workspace — VANTA AI",
  description: "Script breakdown, scenes, shots, storyboards, and film sequence timeline.",
};

interface CinemaProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function CinemaProjectPage({ params }: CinemaProjectPageProps) {
  const resolvedParams = await params;
  const project = await getCinemaProjectDetailsAction(resolvedParams.projectId);

  return (
    <ToastProvider>
      <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
        <CinemaStudioWorkspace project={project} />
      </div>
    </ToastProvider>
  );
}
