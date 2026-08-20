import * as React from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StudioClientContainer } from "@/components/studio/studio-client-container";
import { DashboardGeneration } from "@/components/dashboard/dashboard-content";
import { ToastProvider } from "@/components/ui/toast";
import { getActorContext, getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Video Generation Studio — Vanta AI",
  description: "Command industry-leading generation models with precision engineering.",
};

export default async function StudioVideoPage() {
  const actor = await getActorContext();
  const user = await getAuthenticatedOrGuestUser();

  let generations: any[] = [];
  try {
    generations = await db.generation.findMany({
      where: {
        OR: [
          actor.userId ? { userId: actor.userId } : {},
          actor.guestSessionId ? { guestSessionId: actor.guestSessionId } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { model: true },
      take: 20,
    });
  } catch (err) {
    console.warn("[StudioVideoPage] Generations DB read fallback:", err);
  }

  const userName = user.name || (user.email ? user.email.split("@")[0] : "Guest Creator");
  const creditBalance = actor.testCredits;

  return (
    <ToastProvider>
      <div className="h-screen w-full bg-background text-foreground flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <DashboardSidebar />

        {/* Main Application Container */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <DashboardHeader
            creditBalance={creditBalance}
            userName={userName}
            userEmail={user.email || undefined}
          />

          {/* 3-Column Studio Workspace */}
          <main className="flex-1 overflow-hidden">
            <StudioClientContainer initialGenerations={generations as DashboardGeneration[]} />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
