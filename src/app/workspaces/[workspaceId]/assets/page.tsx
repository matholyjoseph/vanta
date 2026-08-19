import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { FolderOpen, Film, Image as ImageIcon, Music, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  return { title: `Shared Assets — ${workspace?.name || "Workspace"}` };
}

export default async function WorkspaceAssetsPage({ params }: RouteParams) {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  if (!workspace) return notFound();

  const assets = await db.asset.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
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
              <FolderOpen className="h-7 w-7 text-accent" /> Shared Asset Library
            </h1>
          </div>

          <Link href="/assets">
            <Button variant="outline" className="border-border font-mono text-xs">
              Go to Full Assets Library
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-xs">
          {assets.map((a) => (
            <div key={a.id} className="p-4 rounded-2xl border border-border bg-surface/50 space-y-2 shadow-xl">
              <Badge variant="outline" className="border-accent text-accent">
                {a.type}
              </Badge>
              <h4 className="font-bold text-foreground truncate">{a.name}</h4>
              <Link href={a.url} target="_blank">
                <Button variant="outline" className="w-full border-border h-8 font-bold text-[11px] mt-2">
                  <Download className="h-3.5 w-3.5 mr-1" /> View Asset
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </ToastProvider>
  );
}
