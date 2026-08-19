import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ToastProvider } from "@/components/ui/toast";
import { Workflow, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Background Jobs Queue — VANTA AI Admin",
  description: "Monitor background queue dispatcher, active render workers, and retries.",
};

export default async function AdminJobsPage() {
  const stats = await getAdminOverviewAction();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="space-y-6 font-sans">
          <div className="border-b border-border pb-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Workflow className="h-6 w-6 text-accent" /> Background Job Queue Worker
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              Live status of rendering dispatchers, worker threads, and queue health.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-2">
              <div className="text-xs font-mono text-muted uppercase flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-accent animate-spin" /> ACTIVE / PROCESSING JOBS
              </div>
              <div className="text-3xl font-extrabold text-foreground">{stats.activeJobsCount}</div>
              <div className="text-[10px] font-mono text-accent">Currently executing in worker loop</div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-2">
              <div className="text-xs font-mono text-muted uppercase flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> COMPLETED JOBS
              </div>
              <div className="text-3xl font-extrabold text-foreground">{stats.successfulGenerations.toLocaleString()}</div>
              <div className="text-[10px] font-mono text-muted">Successfully rendered output files</div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-2">
              <div className="text-xs font-mono text-muted uppercase flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" /> FAILED JOBS
              </div>
              <div className="text-3xl font-extrabold text-foreground">{stats.failedGenerations.toLocaleString()}</div>
              <div className="text-[10px] font-mono text-muted">Automatic refund processed</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ToastProvider>
  );
}
