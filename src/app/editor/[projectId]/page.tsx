import * as React from "react";
import type { Metadata } from "next";
import { getEditorProjectStateAction } from "@/app/actions/editor-actions";
import { EditorWorkspaceClient } from "@/components/editor/editor-workspace-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Video Editor Workspace — VANTA AI",
  description: "Non-linear multi-track video editing workspace.",
};

interface EditorProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function EditorProjectPage({ params }: EditorProjectPageProps) {
  const resolvedParams = await params;
  const { project, timelineState, userAssets } = await getEditorProjectStateAction(resolvedParams.projectId);

  return (
    <ToastProvider>
      <EditorWorkspaceClient
        initialProject={project}
        initialTimelineState={timelineState}
        userAssets={userAssets}
      />
    </ToastProvider>
  );
}
