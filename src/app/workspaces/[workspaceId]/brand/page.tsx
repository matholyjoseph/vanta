import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Sparkles, Save, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  return { title: `Brand Kit — ${workspace?.name || "Workspace"}` };
}

export default async function WorkspaceBrandPage({ params }: RouteParams) {
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
              <Palette className="h-7 w-7 text-accent" /> Shared Brand Kit & Presets
            </h1>
          </div>

          <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5">
            <Save className="h-4 w-4 mr-2" /> Save Brand Kit
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-surface/50 p-6 space-y-6 font-mono text-xs">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-foreground block uppercase text-[10px]">Primary Color</label>
              <input type="color" defaultValue="#c8ff00" className="w-full h-10 rounded-xl bg-background border border-border p-1" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-foreground block uppercase text-[10px]">Secondary Color</label>
              <input type="color" defaultValue="#09090b" className="w-full h-10 rounded-xl bg-background border border-border p-1" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-foreground block uppercase text-[10px]">Accent Color</label>
              <input type="color" defaultValue="#18181b" className="w-full h-10 rounded-xl bg-background border border-border p-1" />
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
