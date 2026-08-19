import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, Bot, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Authorize External AI Agent — VANTA AI",
  description: "OAuth authorization screen for connecting external AI clients (ChatGPT, Claude, IDE Agents).",
};

interface OAuthAuthorizePageProps {
  searchParams: Promise<{ client_id?: string; redirect_uri?: string; scope?: string }>;
}

export default async function OAuthAuthorizePage({ searchParams }: OAuthAuthorizePageProps) {
  const params = await searchParams;
  const clientName = params.client_id || "External AI Client (ChatGPT / Claude)";
  const requestedScopes = (params.scope || "models:read,generations:create,director:create,assets:read").split(",");

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#09090b] text-foreground flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md p-8 rounded-3xl border border-border bg-surface shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 border-b border-border pb-6">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/40 flex items-center justify-center mx-auto text-accent mb-2">
              <Bot className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Connect to VANTA AI</h1>
            <p className="text-xs text-muted font-mono">
              <span className="text-accent font-bold">{clientName}</span> requests permission to access your workspace.
            </p>
          </div>

          {/* Scope Permissions List */}
          <div className="space-y-3 font-mono text-xs">
            <span className="text-[10px] text-muted uppercase tracking-wider block">Requested Permissions</span>
            <div className="space-y-2">
              {requestedScopes.map((sc) => (
                <div key={sc} className="p-3 rounded-xl border border-border bg-background flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-foreground">{sc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2 font-mono text-xs">
            <Button className="w-full bg-accent text-accent-foreground font-bold h-11 rounded-xl cursor-pointer">
              Authorize Agent Connection
            </Button>

            <Button variant="ghost" className="w-full text-muted hover:text-foreground h-10">
              Cancel
            </Button>
          </div>

          <p className="text-[10px] text-muted text-center font-mono">
            You can revoke connected agents at any time in Developer Settings.
          </p>
        </div>
      </div>
    </ToastProvider>
  );
}
