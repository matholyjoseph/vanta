import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { NewWorkspaceForm } from "@/components/workspaces/new-workspace-form";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Create Workspace — VANTA AI",
  description: "Create a new team workspace for collaborative AI filmmaking.",
};

export default function NewWorkspacePage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#09090b] text-foreground flex items-center justify-center p-6 font-sans">
        <NewWorkspaceForm />
      </div>
    </ToastProvider>
  );
}
