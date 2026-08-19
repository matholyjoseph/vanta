"use client";

import * as React from "react";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { DashboardGeneration } from "@/components/dashboard/dashboard-content";

interface StudioClientContainerProps {
  initialGenerations: DashboardGeneration[];
}

export function StudioClientContainer({ initialGenerations }: StudioClientContainerProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <StudioWorkspace initialGenerations={initialGenerations} />
    </div>
  );
}
