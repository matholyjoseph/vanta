import * as React from "react";
import type { Metadata } from "next";
import { getAdminAuditLogsAction, getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ToastProvider } from "@/components/ui/toast";
import { History, ShieldCheck, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Admin Audit Logs — VANTA AI Admin",
  description: "Immutable security audit log tracking administrator actions, role changes, and credit grants.",
};

export default async function AdminAuditLogsPage() {
  const [auditData, stats] = await Promise.all([
    getAdminAuditLogsAction(),
    getAdminOverviewAction(),
  ]);

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="space-y-6 font-sans">
          <div className="border-b border-border pb-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <History className="h-6 w-6 text-accent" /> Security Audit Log Trail
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              Immutable ledger of sensitive administrative operations, credit adjustments, and role updates.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-background border-b border-border text-muted uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Admin User</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target Type</th>
                    <th className="p-4">Target ID</th>
                    <th className="p-4">Reason / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditData.auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted">
                        No audit log entries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditData.auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-hover transition-colors">
                        <td className="p-4 text-muted">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-foreground font-sans">
                          {log.adminUser?.email || "System"}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-[10px]">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted">{log.targetType}</td>
                        <td className="p-4 text-muted">{log.targetId || "—"}</td>
                        <td className="p-4 text-foreground/90 font-sans">{log.reason || log.afterData || "—"}</td>
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
