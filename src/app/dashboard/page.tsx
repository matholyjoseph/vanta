import * as React from "react";
import type { Metadata } from "next";
import { getDashboardData } from "@/app/actions/dashboard";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { ToastProvider } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — Vanta AI Studio",
  description: "Manage your AI video generations, projects, and creative assets.",
};

export default async function DashboardPage() {
  const { user, wallet, generations, projects } = await getDashboardData();

  const userName =
    user?.name ||
    (user?.email ? user.email.split("@")[0] : "Creator");

  const creditBalance = wallet?.balance ?? 2450;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Left Vertical Navigation Sidebar */}
        <DashboardSidebar />

        {/* Main Application Column */}
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader
            creditBalance={creditBalance}
            userName={userName}
            userEmail={user?.email || undefined}
          />

          <main className="flex-1 overflow-y-auto">
            <DashboardContent
              userName={userName}
              generations={generations}
              projects={projects}
            />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
