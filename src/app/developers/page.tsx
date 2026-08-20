import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Code2,
  Key,
  Webhook,
  Activity,
  BarChart3,
  Terminal,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDeveloperOverviewMetricsAction } from "@/app/actions/developer-actions";
import { ToastProvider } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Developer Portal — VANTA AI Platform",
  description: "Public API platform, API key management, webhooks, and developer tools.",
};

export default async function DevelopersHomePage() {
  const metrics = await getDeveloperOverviewMetricsAction();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-10 max-w-7xl mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-accent font-mono text-xs font-semibold tracking-wider uppercase mb-1">
              <Code2 className="h-4 w-4" /> VANTA Developer Platform v1.0
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              Developer Dashboard
            </h1>
            <p className="text-sm text-muted mt-1 font-mono">
              Build custom video, image, audio, and agent workflows using VANTA programmatically.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link href="/developers/docs">
              <Button variant="outline" className="border-border">
                <Terminal className="h-4 w-4 mr-2 text-accent" /> API Docs
              </Button>
            </Link>
            <Link href="/developers/api-keys">
              <Button className="bg-accent text-accent-foreground font-bold">
                <Key className="h-4 w-4 mr-2" /> Manage API Keys
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-5 rounded-2xl border border-border bg-surface/50 space-y-1">
            <span className="text-[10px] text-muted uppercase">Active API Keys</span>
            <div className="text-2xl font-extrabold text-foreground">{metrics.activeKeys} Keys</div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-surface/50 space-y-1">
            <span className="text-[10px] text-muted uppercase">Requests Today</span>
            <div className="text-2xl font-extrabold text-accent">{metrics.totalRequestsToday} Req</div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-surface/50 space-y-1">
            <span className="text-[10px] text-muted uppercase">Success Rate</span>
            <div className="text-2xl font-extrabold text-foreground">
              {metrics.totalRequestsToday > 0
                ? `${Math.round((metrics.successfulRequests / metrics.totalRequestsToday) * 100)}%`
                : "100%"}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-surface/50 space-y-1">
            <span className="text-[10px] text-muted uppercase">Webhook Health</span>
            <div className="text-2xl font-extrabold text-accent flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent" /> {metrics.webhookHealth}
            </div>
          </div>
        </div>

        {/* Quick Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          <Link
            href="/developers/api-keys"
            className="group p-6 rounded-2xl border border-border bg-surface hover:border-accent/50 transition-all space-y-3"
          >
            <Key className="h-8 w-8 text-accent" />
            <h3 className="text-lg font-bold text-foreground group-hover:text-accent">API Keys</h3>
            <p className="text-xs text-muted font-mono leading-relaxed">
              Create, rotate, and manage Bearer API keys with granular scope permissions.
            </p>
          </Link>

          <Link
            href="/developers/playground"
            className="group p-6 rounded-2xl border border-border bg-surface hover:border-accent/50 transition-all space-y-3"
          >
            <Terminal className="h-8 w-8 text-accent" />
            <h3 className="text-lg font-bold text-foreground group-hover:text-accent">API Playground</h3>
            <p className="text-xs text-muted font-mono leading-relaxed">
              Test video, image, audio, and AI Director API calls directly from your browser.
            </p>
          </Link>

          <Link
            href="/developers/webhooks"
            className="group p-6 rounded-2xl border border-border bg-surface hover:border-accent/50 transition-all space-y-3"
          >
            <Webhook className="h-8 w-8 text-accent" />
            <h3 className="text-lg font-bold text-foreground group-hover:text-accent">Webhooks</h3>
            <p className="text-xs text-muted font-mono leading-relaxed">
              Configure signed outbound webhooks (HMAC-SHA256) for async job completion.
            </p>
          </Link>
        </div>
      </div>
    </ToastProvider>
  );
}
