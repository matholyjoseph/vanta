import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Bot, Key, Webhook, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  return { title: `Integrations — ${workspace?.name || "Workspace"}` };
}

export default async function WorkspaceIntegrationsPage({ params }: RouteParams) {
  const resolved = await params;
  const workspace = await db.workspace.findUnique({ where: { id: resolved.workspaceId } });
  if (!workspace) return notFound();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
        <div className="border-b border-border pb-6 flex items-center justify-between">
          <div>
            <Link href={`/workspaces/${workspace.id}`} className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
              ← {workspace.name} Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Bot className="h-7 w-7 text-accent" /> Workspace Integrations & MCP
            </h1>
          </div>

          <Link href="/developers/mcp">
            <Button variant="outline" className="border-border font-mono text-xs">
              Go to MCP Settings
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          <div className="p-6 rounded-3xl border border-border bg-surface/50 space-y-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent" /> Model Context Protocol (MCP)
            </h3>
            <p className="text-muted text-xs font-sans">Connect ChatGPT, Claude, and IDE agents to this workspace context.</p>
          </div>

          <div className="p-6 rounded-3xl border border-border bg-surface/50 space-y-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Key className="h-5 w-5 text-accent" /> Workspace API Keys
            </h3>
            <p className="text-muted text-xs font-sans">Issue REST API keys bound to this team workspace.</p>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
