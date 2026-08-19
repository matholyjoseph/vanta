import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { db } from "@/lib/db";
import { Users, Shield, Save, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Workspaces Admin — Admin Control Center",
  description: "Admin metrics and oversight for customer team workspaces.",
};

export default async function AdminWorkspacesPage() {
  const stats = await getAdminOverviewAction();
  const workspaces = await db.workspace.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { members: true, wallet: true },
  });

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto font-sans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Users className="h-7 w-7 text-accent" /> Workspaces Admin Control
              </h1>
              <p className="text-xs text-muted mt-1 font-mono">
                System-wide oversight for customer team workspaces, seat limits, and credit wallets.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface overflow-hidden font-mono text-xs shadow-xl">
            <div className="p-4 border-b border-border font-bold text-foreground bg-surface/40">
              Active Customer Workspaces ({workspaces.length})
            </div>

            <div className="divide-y divide-border/60">
              {workspaces.map((w) => (
                <div key={w.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{w.name}</span>
                      <Badge variant="outline" className="border-accent text-accent">
                        {w.status}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted block mt-1">
                      Members: {w.members.length} / {w.seatLimit} · Wallet Balance: {w.wallet?.balance ?? 1000} Credits
                    </span>
                  </div>

                  <Badge variant="outline" className="border-border">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ToastProvider>
  );
}
