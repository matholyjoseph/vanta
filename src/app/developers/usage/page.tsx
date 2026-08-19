import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, TrendingUp, Cpu, Zap } from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "API Usage & Credit Analytics — Developer Portal",
  description: "Track API request volume, rate limits, credit consumption, and media type distribution.",
};

export default async function UsageAnalyticsPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
        <div className="border-b border-border pb-6">
          <Link href="/developers" className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
            ← Developer Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-accent" /> API Usage & Credit Analytics
          </h1>
          <p className="text-sm text-muted mt-1 font-mono">
            Detailed breakdown of API request volume, latency, credit consumption, and model distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          <div className="p-6 rounded-2xl border border-border bg-surface/50 space-y-2">
            <span className="text-[10px] text-muted uppercase">Requests This Month</span>
            <div className="text-3xl font-extrabold text-foreground">1,240</div>
            <span className="text-[11px] text-accent font-bold">+18% from last month</span>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-surface/50 space-y-2">
            <span className="text-[10px] text-muted uppercase">Credits Consumed</span>
            <div className="text-3xl font-extrabold text-accent">14,800 Credits</div>
            <span className="text-[11px] text-muted">Shared Wallet Balance</span>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-surface/50 space-y-2">
            <span className="text-[10px] text-muted uppercase">Rate Limit Tier</span>
            <div className="text-3xl font-extrabold text-foreground">STANDARD</div>
            <span className="text-[11px] text-muted">100 Req / Min Limit</span>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
