import * as React from "react";
import type { Metadata } from "next";
import { getDirectorRunDetailsAction } from "@/app/actions/director-actions";
import { DirectorWorkspaceClient } from "@/components/director/director-workspace-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "AI Director Workspace — VANTA AI",
  description: "Production Control Center for autonomous AI video orchestration.",
};

interface DirectorRunPageProps {
  params: Promise<{ runId: string }>;
}

export default async function DirectorRunPage({ params }: DirectorRunPageProps) {
  const resolvedParams = await params;
  const run = await getDirectorRunDetailsAction(resolvedParams.runId);

  return (
    <ToastProvider>
      <DirectorWorkspaceClient initialRun={run} />
    </ToastProvider>
  );
}
