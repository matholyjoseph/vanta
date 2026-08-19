import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Settings, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  return { title: `Settings — ${workspace?.name || "Workspace"}` };
}

export default async function WorkspaceSettingsPage({ params }: RouteParams) {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  if (!workspace) return notFound();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-4xl mx-auto font-sans">
        <div className="border-b border-border pb-6 flex items-center justify-between">
          <div>
            <Link href={`/workspaces/${workspace.id}`} className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
              ← {workspace.name} Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Settings className="h-7 w-7 text-accent" /> Workspace Settings
            </h1>
          </div>

          <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5">
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-surface/50 p-6 space-y-6 font-mono text-xs">
          <div className="space-y-1">
            <label className="font-bold text-foreground block uppercase text-[10px]">Workspace Name</label>
            <input defaultValue={workspace.name} className="w-full rounded-xl border border-border bg-background p-3" />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-foreground block uppercase text-[10px]">Default Project Visibility</label>
            <select defaultValue={workspace.defaultProjectVisibility} className="w-full rounded-xl border border-border bg-background p-3">
              <option value="WORKSPACE">WORKSPACE (Visible to all team members)</option>
              <option value="RESTRICTED">RESTRICTED (Explicit project members only)</option>
            </select>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
