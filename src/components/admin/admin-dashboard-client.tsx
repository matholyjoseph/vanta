"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Film,
  Zap,
  ShieldCheck,
  Radio,
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminDashboardClientProps {
  stats: any;
}

export function AdminDashboardClient({ stats }: AdminDashboardClientProps) {
  const totalUsers = stats?.totalUsers ?? 0;
  const activePaidUsers = stats?.activePaidUsers ?? 0;
  const newUsersToday = stats?.newUsersToday ?? 0;
  const totalGenerations = stats?.totalGenerations ?? 0;
  const generationsToday = stats?.generationsToday ?? 0;
  const successfulGenerations = stats?.successfulGenerations ?? 0;
  const failedGenerations = stats?.failedGenerations ?? 0;
  const totalCreditsAllocated = stats?.totalCreditsAllocated ?? 0;
  const estimatedSubscriptionRevenue = stats?.estimatedSubscriptionRevenue ?? 0;
  const estimatedProviderCost = stats?.estimatedProviderCost ?? "0.00";
  const estimatedGrossProfit = stats?.estimatedGrossProfit ?? "0.00";
  const activeJobsCount = stats?.activeJobsCount ?? 0;
  const providerStats = stats?.providerStats ?? [];
  const recentAuditLogs = stats?.recentAuditLogs ?? [];

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" /> Platform Operational Control Center
          </h1>
          <p className="text-xs text-muted mt-1 font-mono">
            Realtime database aggregations, revenue estimates, provider health, and operational metrics.
          </p>
        </div>

        <Badge variant="outline" className="text-xs font-mono text-accent border-accent/40 px-3 py-1 bg-accent/5">
          Role: {stats?.adminRole || "SUPER_ADMIN"}
        </Badge>
      </div>

      {/* KPI Cards Grid (4x2 layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted font-mono text-xs">
            <span>TOTAL USERS</span>
            <Users className="h-4 w-4 text-accent" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">{totalUsers.toLocaleString()}</div>
          <div className="text-[10px] font-mono text-accent">+{newUsersToday} new creators today</div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted font-mono text-xs">
            <span>ACTIVE SUBSCRIBERS</span>
            <ShieldCheck className="h-4 w-4 text-accent" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">{activePaidUsers.toLocaleString()}</div>
          <div className="text-[10px] font-mono text-emerald-400">Paid Tiers (Creator / Pro / Ultra)</div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted font-mono text-xs">
            <span>GENERATIONS RENDERED</span>
            <Film className="h-4 w-4 text-accent" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">{totalGenerations.toLocaleString()}</div>
          <div className="text-[10px] font-mono text-accent">{generationsToday} rendered today</div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-accent font-mono text-xs font-bold">
            <span>CREDITS IN CIRCULATION</span>
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">{totalCreditsAllocated.toLocaleString()}</div>
          <div className="text-[10px] font-mono text-accent">Active Ledger Balance</div>
        </div>

        {/* KPI 5 */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted font-mono text-xs">
            <span>ESTIMATED MRR</span>
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">${estimatedSubscriptionRevenue.toLocaleString()}</div>
          <div className="text-[10px] font-mono text-muted">Subscription Revenue</div>
        </div>

        {/* KPI 6 */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted font-mono text-xs">
            <span>ESTIMATED PROVIDER COST</span>
            <Radio className="h-4 w-4 text-accent" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">${estimatedProviderCost}</div>
          <div className="text-[10px] font-mono text-muted">API Render Expense</div>
        </div>

        {/* KPI 7 */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 font-mono text-xs font-bold">
            <span>GROSS MARGIN (EST.)</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">${estimatedGrossProfit}</div>
          <div className="text-[10px] font-mono text-emerald-400">Net Platform Operating Profit</div>
        </div>

        {/* KPI 8 */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted font-mono text-xs">
            <span>ACTIVE WORKER JOBS</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
          </div>
          <div className="text-3xl font-extrabold text-foreground">{activeJobsCount}</div>
          <div className="text-[10px] font-mono text-accent">Queue Processing</div>
        </div>
      </div>

      {/* Provider Health & Status Overview */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Radio className="h-5 w-5 text-accent" /> AI Render Providers Health
          </h2>
          <Link href="/admin/providers" className="text-xs font-mono text-muted hover:text-accent flex items-center gap-1">
            Manage Providers <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providerStats.map((provider: any) => (
            <div key={provider.id} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={`text-xs font-mono font-bold ${
                    provider.status === "ONLINE"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  ● {provider.status}
                </Badge>
                <span className="text-xs font-mono text-muted">Slug: {provider.slug}</span>
              </div>
              <h3 className="font-bold text-base text-foreground">{provider.name}</h3>
              <div className="text-xs font-mono text-muted">
                Active Models: <span className="text-foreground">{provider.enabledModelCount} / {provider.modelCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-accent" /> Recent Admin Audit Log
          </h2>
          <Link href="/admin/audit-logs" className="text-xs font-mono text-muted hover:text-accent flex items-center gap-1">
            View All Audit Trail <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
          {recentAuditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-muted">
              No recent audit log entries.
            </div>
          ) : (
            recentAuditLogs.map((log: any) => (
              <div key={log.id} className="p-4 flex items-center justify-between gap-4 text-xs font-mono hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-[10px]">
                    {log.action}
                  </Badge>
                  <div>
                    <span className="font-bold text-foreground font-sans">{log.adminUser?.email || "System"}</span>
                    <span className="text-muted ml-2">{log.reason || log.targetType}</span>
                  </div>
                </div>
                <div className="text-muted text-[10px]">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
