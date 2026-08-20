import * as React from "react";
import type { Metadata } from "next";
import { getDirectorHistoryAction } from "@/app/actions/director-actions";
import { DirectorHomeClient } from "@/components/director/director-home-client";
import { ToastProvider } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VANTA AI Director — Autonomous Production Agent",
  description: "Natural-language multi-model AI video production planner and orchestrator.",
};

export default async function DirectorHomePage() {
  const initialRuns = await getDirectorHistoryAction();

  return (
    <ToastProvider>
      <DirectorHomeClient initialRuns={initialRuns} />
    </ToastProvider>
  );
}
