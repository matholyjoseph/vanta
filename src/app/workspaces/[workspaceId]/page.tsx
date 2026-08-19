import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { permissionService } from "@/lib/collaboration/permission-service";
import { Users, FolderKanban, FolderOpen, Activity, Settings, CreditCard, Sparkles, Layers, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { ToastProvider } from "@/components/ui/toast";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  return {
    title: `${workspace?.name || "Workspace"} — VANTA AI`,
  };
}

export default async function WorkspaceDashboardPage({ params }: RouteParams) {
  const resolved = await params;
  const user = await getAuthenticatedOrGuestUser();

  const workspace = await db.workspace.findUnique({
    where: { id: resolved.workspaceId },
    include: {
      members: { include: { role: true } },
      wallet: true,
      activities: { take: 10, orderBy: { createdAt: "desc" } },
    },
  });

  if (!workspace) return notFound();

  const hasAccess = await permissionService.hasPermission(user.id, workspace.id, "workspace:view");
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center space-y-3 font-mono">
          <Shield className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-xs text-muted">You do not have permission to access this team workspace.</p>
        </div>
      </div>
    );
  }

  const projects = await db.project.findMany({
    where: { workspaceId: workspace.id },
    take: 6,
    orderBy: { updatedAt: "desc" },
  });

  const assets = await db.asset.findMany({
    where: { workspaceId: workspace.id },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
        {/* Header with Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <WorkspaceSwitcher workspaces={[{ id: workspace.id, name: workspace.name }]} activeWorkspaceId={workspace.id} />
              <Badge variant="outline" className="border-accent text-accent font-mono text-xs">
                TEAM WORKSPACE
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{workspace.name}</h1>
            <p className="text-xs text-muted font-mono">{workspace.description || "Shared team workspace"}</p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link href={`/workspaces/${workspace.id}/members`}>
              <Button variant="outline" className="border-border">
                <Users className="h-4 w-4 mr-2 text-accent" /> {workspace.members.length} Members
              </Button>
            </Link>
            <Link href={`/workspaces/${workspace.id}/projects`}>
              <Button className="bg-accent text-accent-foreground font-bold">
                <FolderKanban className="h-4 w-4 mr-2" /> View Shared Projects
              </Button>
            </Link>
          </div>
        </div>

        {/* Workspace Quick Sub-nav */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 font-mono text-xs border-b border-border">
          <Link href={`/workspaces/${workspace.id}`} className="px-3 py-1.5 rounded-xl bg-surface font-bold text-accent">
            Overview
          </Link>
          <Link href={`/workspaces/${workspace.id}/projects`} className="px-3 py-1.5 rounded-xl text-muted hover:text-foreground">
            Projects ({projects.length})
          </Link>
          <Link href={`/workspaces/${workspace.id}/assets`} className="px-3 py-1.5 rounded-xl text-muted hover:text-foreground">
            Assets ({assets.length})
          </Link>
          <Link href={`/workspaces/${workspace.id}/members`} className="px-3 py-1.5 rounded-xl text-muted hover:text-foreground">
            Members
          </Link>
          <Link href={`/workspaces/${workspace.id}/activity`} className="px-3 py-1.5 rounded-xl text-muted hover:text-foreground">
            Activity
          </Link>
          <Link href={`/workspaces/${workspace.id}/billing`} className="px-3 py-1.5 rounded-xl text-muted hover:text-foreground">
            Credits ({workspace.wallet?.balance ?? 1000})
          </Link>
          <Link href={`/workspaces/${workspace.id}/brand`} className="px-3 py-1.5 rounded-xl text-muted hover:text-foreground">
            Brand Kit
          </Link>
        </div>

        {/* 3-Column Stats & Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          {/* Projects Card */}
          <div className="rounded-3xl border border-border bg-surface/50 p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-bold text-foreground flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-accent" /> Recent Projects
              </span>
              <span className="text-muted text-[10px]">{projects.length} Total</span>
            </div>

            <div className="space-y-2">
              {projects.length === 0 ? (
                <div className="text-muted text-[11px] py-4 text-center">No workspace projects created yet.</div>
              ) : (
                projects.map((p) => (
                  <Link key={p.id} href={`/cinema/${p.id}`} className="block p-3 rounded-xl border border-border bg-background hover:border-accent/40">
                    <span className="font-bold text-foreground block truncate">{p.name}</span>
                    <span className="text-[10px] text-muted">{p.aspectRatio} · {p.status}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed Card */}
          <div className="rounded-3xl border border-border bg-surface/50 p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" /> Team Activity Feed
              </span>
            </div>

            <div className="space-y-2">
              {workspace.activities.map((a) => (
                <div key={a.id} className="p-2.5 rounded-xl border border-border bg-background">
                  <span className="font-bold text-accent block">{a.action}</span>
                  <span className="text-[10px] text-muted">{new Date(a.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Wallet & Members Card */}
          <div className="rounded-3xl border border-border bg-surface/50 p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-bold text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-accent" /> Workspace Credit Wallet
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-background space-y-1">
              <span className="text-muted text-[10px] uppercase">Available Balance</span>
              <div className="text-3xl font-extrabold text-accent">{workspace.wallet?.balance ?? 1000} Credits</div>
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
