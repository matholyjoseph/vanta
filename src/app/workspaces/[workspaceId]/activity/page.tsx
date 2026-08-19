import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Activity, Clock } from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  return { title: `Activity & Audit — ${workspace?.name || "Workspace"}` };
}

export default async function WorkspaceActivityPage({ params }: RouteParams) {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  if (!workspace) return notFound();

  const activities = await db.workspaceActivity.findMany({
    where: { workspaceId: workspace.id },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
        <div className="border-b border-border pb-6">
          <Link href={`/workspaces/${workspace.id}`} className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
            ← {workspace.name} Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Activity className="h-7 w-7 text-accent" /> Chronological Activity Feed
          </h1>
        </div>

        <div className="rounded-2xl border border-border bg-surface/50 p-6 space-y-3 font-mono text-xs shadow-xl">
          {activities.map((a) => (
            <div key={a.id} className="p-3.5 rounded-xl border border-border bg-background flex items-center justify-between">
              <div>
                <span className="font-bold text-accent block">{a.action}</span>
                <span className="text-[10px] text-muted font-sans">{a.metadata || a.targetType}</span>
              </div>
              <span className="text-[10px] text-muted">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </ToastProvider>
  );
}
