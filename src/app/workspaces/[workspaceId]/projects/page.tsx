import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { FolderKanban, Plus, Clapperboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  return { title: `Projects — ${workspace?.name || "Workspace"}` };
}

export default async function WorkspaceProjectsPage({ params }: RouteParams) {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  if (!workspace) return notFound();

  const projects = await db.project.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
        <div className="border-b border-border pb-6 flex items-center justify-between">
          <div>
            <Link href={`/workspaces/${workspace.id}`} className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
              ← {workspace.name} Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <FolderKanban className="h-7 w-7 text-accent" /> Shared Team Projects
            </h1>
          </div>

          <Link href="/cinema">
            <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5">
              <Plus className="h-4 w-4 mr-2" /> New Cinema Project
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          {projects.map((p) => (
            <div key={p.id} className="p-5 rounded-3xl border border-border bg-surface/50 space-y-3 shadow-xl">
              <Badge variant="outline" className="border-accent text-accent">
                {p.aspectRatio}
              </Badge>
              <h3 className="text-base font-bold text-foreground truncate">{p.name}</h3>
              <p className="text-muted text-xs font-sans">{p.description || "Shared cinema project"}</p>
              <Link href={`/cinema/${p.id}`}>
                <Button variant="outline" className="w-full border-border font-bold h-9 mt-2">
                  Open Project
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </ToastProvider>
  );
}
