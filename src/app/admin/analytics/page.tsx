import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ToastProvider } from "@/components/ui/toast";
import { BarChart3, TrendingUp, Users, Film, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Platform Analytics & Unit Economics — VANTA AI Admin",
  description: "DAU/WAU/MAU, subscription metrics, provider cost, and gross margin analytics.",
};

export default async function AdminAnalyticsPage() {
  const stats = await getAdminOverviewAction();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="space-y-6 font-sans">
          <div className="border-b border-border pb-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-accent" /> Platform Analytics & Financial Margin
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              Live unit economics, subscriber conversion, model usage distribution, and provider costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-2">
              <div className="text-xs font-mono text-muted uppercase">ESTIMATED MRR</div>
              <div className="text-3xl font-extrabold text-foreground">${stats.estimatedSubscriptionRevenue.toLocaleString()}</div>
              <div className="text-[10px] font-mono text-accent">Monthly Recurring Revenue</div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-2">
              <div className="text-xs font-mono text-muted uppercase">PROVIDER RENDER COST</div>
              <div className="text-3xl font-extrabold text-foreground">${stats.estimatedProviderCost}</div>
              <div className="text-[10px] font-mono text-muted">API Cost</div>
            </div>

            <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6 space-y-2">
              <div className="text-xs font-mono text-accent font-bold uppercase">ESTIMATED GROSS PROFIT</div>
              <div className="text-3xl font-extrabold text-foreground">${stats.estimatedGrossProfit}</div>
              <div className="text-[10px] font-mono text-accent">Subscription Revenue - API Cost</div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-2">
              <div className="text-xs font-mono text-muted uppercase">GENERATION SUCCESS RATE</div>
              <div className="text-3xl font-extrabold text-foreground">
                {stats.totalGenerations > 0
                  ? ((stats.successfulGenerations / stats.totalGenerations) * 100).toFixed(1)
                  : "100.0"}%
              </div>
              <div className="text-[10px] font-mono text-emerald-400">Successful Syntheses</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ToastProvider>
  );
}
