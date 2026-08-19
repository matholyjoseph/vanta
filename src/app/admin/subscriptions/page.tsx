import * as React from "react";
import type { Metadata } from "next";
import { getAdminSubscriptionsAction, getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ToastProvider } from "@/components/ui/toast";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Subscriptions — VANTA AI Admin",
  description: "Manage creator, pro, and ultra subscription tiers.",
};

export default async function AdminSubscriptionsPage() {
  const [subData, stats] = await Promise.all([
    getAdminSubscriptionsAction(),
    getAdminOverviewAction(),
  ]);

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="space-y-6 font-sans">
          <div className="border-b border-border pb-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-accent" /> Active Subscriptions & Plans
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              {subData.totalCount} active subscribers across Creator, Pro & Ultra plans.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-background border-b border-border text-muted uppercase text-[10px]">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Stripe Sub ID</th>
                    <th className="p-4">Current Period End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subData.subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted">
                        No active subscriptions found.
                      </td>
                    </tr>
                  ) : (
                    subData.subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-surface-hover transition-colors">
                        <td className="p-4 font-bold text-foreground font-sans">
                          {sub.user?.email || "Anonymous"}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-[10px]">
                            {sub.plan?.name}
                          </Badge>
                        </td>
                        <td className="p-4 uppercase text-emerald-400 font-bold">{sub.status}</td>
                        <td className="p-4 text-muted">{sub.stripeSubscriptionId || "sub_mock_123"}</td>
                        <td className="p-4 text-muted">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ToastProvider>
  );
}
