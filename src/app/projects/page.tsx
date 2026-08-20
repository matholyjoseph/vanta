import * as React from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getProjectsAction } from "@/app/actions/projects";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProjectListClient } from "@/components/projects/project-list-client";
import { ToastProvider } from "@/components/ui/toast";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects — Vanta AI Cinema Studio",
  description: "Manage your multi-scene AI video projects and storyboards.",
};

export default async function ProjectsPage() {
  const user = await getAuthenticatedOrGuestUser();
  const userId = user.id;

  let wallet: any = null;
  try {
    wallet = await db.creditWallet.findUnique({ where: { userId } });
  } catch (err) {
    console.warn("[ProjectsPage] Wallet DB read fallback:", err);
  }

  const projects = await getProjectsAction();

  const userName = user.name || (user.email ? user.email.split("@")[0] : "Guest Creator");
  const creditBalance = wallet?.balance ?? 10000;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader
            creditBalance={creditBalance}
            userName={userName}
            userEmail={user.email || undefined}
          />

          <main className="flex-1 overflow-y-auto">
            <ProjectListClient initialProjects={projects} />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
