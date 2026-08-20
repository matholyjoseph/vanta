import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getUserWorkspacesAction } from "@/app/actions/workspace-actions";
import { Users, Plus, FolderKanban, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspaces — VANTA AI",
  description: "Manage team workspaces, collaborative projects, and shared assets.",
};

export default async function WorkspacesPage() {
  const workspaces = await getUserWorkspacesAction();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Users className="h-7 w-7 text-accent" /> Workspaces Hub
            </h1>
            <p className="text-sm text-muted mt-1 font-mono">
              Switch between personal projects and team workspaces.
            </p>
          </div>

          <Link href="/workspaces/new">
            <Button className="bg-accent text-accent-foreground font-bold text-xs h-11 px-6 rounded-xl cursor-pointer">
              <Plus className="h-4 w-4 mr-2" /> Create New Workspace
            </Button>
          </Link>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          {/* Personal Space Card */}
          <div className="rounded-3xl border border-border bg-surface/50 p-6 space-y-4 font-mono text-xs flex flex-col justify-between hover:border-accent/40 transition-all shadow-xl">
            <div className="space-y-2">
              <Badge variant="outline" className="border-accent text-accent">
                PERSONAL
              </Badge>
              <h3 className="text-lg font-bold text-foreground">Personal Space</h3>
              <p className="text-muted text-xs font-sans">
                Your private workspace for individual projects and custom creations.
              </p>
            </div>

            <Link href="/dashboard">
              <Button variant="outline" className="w-full border-border font-bold text-xs h-10 rounded-xl cursor-pointer">
                Enter Personal Space <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Team Workspaces */}
          {workspaces.map((w) => (
            <div
              key={w.id}
              className="rounded-3xl border border-border bg-surface/50 p-6 space-y-4 font-mono text-xs flex flex-col justify-between hover:border-accent/40 transition-all shadow-xl"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-green-500 text-green-400">
                    TEAM WORKSPACE
                  </Badge>
                  <span className="text-[10px] text-muted">{w.members.length} Members</span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{w.name}</h3>
                <p className="text-muted text-xs font-sans">{w.description || "Shared team workspace"}</p>
              </div>

              <Link href={`/workspaces/${w.id}`}>
                <Button className="w-full bg-accent text-accent-foreground font-bold text-xs h-10 rounded-xl cursor-pointer">
                  Open Workspace <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </ToastProvider>
  );
}
