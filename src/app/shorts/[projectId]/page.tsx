import * as React from "react";
import type { Metadata } from "next";
import { getShortsProjectDetailsAction } from "@/app/actions/shorts-actions";
import { ShortsWorkspaceClient } from "@/components/shorts/shorts-workspace-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Shorts Studio Control Center — VANTA AI",
  description: "AI viral social clipping and 9:16 vertical video editor.",
};

interface ShortsProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ShortsProjectPage({ params }: ShortsProjectPageProps) {
  const resolvedParams = await params;
  const project = await getShortsProjectDetailsAction(resolvedParams.projectId);

  return (
    <ToastProvider>
      <ShortsWorkspaceClient initialProject={project} />
    </ToastProvider>
  );
}
