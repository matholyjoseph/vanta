import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ToastProvider } from "@/components/ui/toast";
import { Zap, Receipt, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Credit Wallet Analytics — VANTA AI Admin",
  description: "Monitor platform credit distribution, usage, and manual adjustments.",
};

export default async function AdminCreditsPage() {
  const stats = await getAdminOverviewAction();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="space-y-6 font-sans">
          <div className="border-b border-border pb-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap className="h-6 w-6 text-accent" /> System Credit Wallet Ledger
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              Track global credit circulation, signup allocations, and transaction history.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6 space-y-2">
              <div className="text-xs font-mono text-accent uppercase font-bold">TOTAL CREDITS IN CIRCULATION</div>
              <div className="text-3xl font-extrabold text-foreground">{stats.totalCreditsAllocated.toLocaleString()}</div>
              <div className="text-[10px] font-mono text-muted">Across all user wallets</div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-2">
              <div className="text-xs font-mono text-muted uppercase">ESTIMATED REVENUE VALUE</div>
              <div className="text-3xl font-extrabold text-foreground">
                ${(stats.totalCreditsAllocated * 0.025).toFixed(2)}
              </div>
              <div className="text-[10px] font-mono text-muted">At $0.025 per credit equivalent</div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-2">
              <div className="text-xs font-mono text-muted uppercase font-bold">GENERATIONS CONSUMED</div>
              <div className="text-3xl font-extrabold text-foreground">{stats.successfulGenerations.toLocaleString()}</div>
              <div className="text-[10px] font-mono text-muted">Successful renders</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ToastProvider>
  );
}
