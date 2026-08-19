import * as React from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProjectDetailAction } from "@/app/actions/projects";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CinemaStudioClient, type ProjectData } from "@/components/projects/cinema-studio-client";
import { ToastProvider } from "@/components/ui/toast";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Cinema Studio — Project ${id}`,
    description: "Multi-scene video production timeline and storyboard workspace.",
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  let user = null;
  if (session?.user?.id) {
    user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    });
  }

  if (!user && session?.user?.email) {
    user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true },
    });
  }

  const userId = user?.id;

  let wallet = null;
  let project = null;

  if (userId) {
    wallet = await db.creditWallet.findUnique({ where: { userId } });
    try {
      project = await getProjectDetailAction(id);
    } catch {
      // Fallback for non-existent or demo routes
    }
  }

  if (!project) {
    // If not found in DB, return 404 or default demo project structure
    project = {
      id,
      name: "Neon Genesis: Echoes",
      description: "SCI-FI SHORT • 24FPS • 4K UHD",
      status: "active",
      sceneCount: 2,
      scenes: [
        {
          id: "sc-1",
          title: "Scene 01 - City Approach",
          description: "Neo Tokyo skyline approach in heavy rain",
          order: 0,
          shots: [
            {
              id: "sh-1",
              shotNumber: "Shot 1.1",
              prompt: "Establishing wide shot of @Penthouse skyline approach in heavy rain.",
              duration: "00:04",
              status: "COMPLETED",
              videoUrl: "/placeholder-video.mp4",
              order: 0,
            },
            {
              id: "sh-2",
              shotNumber: "Shot 1.2",
              prompt: "Medium shot tracking @Maya inside cockpit adjusting holographic lens.",
              duration: "00:04",
              status: "IDLE",
              order: 1,
            },
          ],
        },
      ],
      elements: [
        {
          id: "el-1",
          name: "Maya",
          type: "CHARACTER",
          description: "Protagonist with glowing cybernetic eye",
        },
        {
          id: "el-2",
          name: "Penthouse",
          type: "LOCATION",
          description: "Luxury penthouse overlooking metropolis",
        },
      ],
    };
  }

  const userName = user?.name || (user?.email ? user.email.split("@")[0] : "Creator");
  const creditBalance = wallet?.balance ?? 2450;

  return (
    <ToastProvider>
      <div className="h-screen w-full bg-background text-foreground flex overflow-hidden">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <DashboardHeader
            creditBalance={creditBalance}
            userName={userName}
            userEmail={user?.email || undefined}
          />

          <main className="flex-1 overflow-hidden">
            <CinemaStudioClient initialProject={project as unknown as ProjectData} />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
