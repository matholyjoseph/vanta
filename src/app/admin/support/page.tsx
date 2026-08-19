import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { supportService } from "@/lib/support/support-service";
import { LifeBuoy, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Support Desk — Admin Control Center",
  description: "Admin overview of customer support tickets and requests.",
};

export default async function AdminSupportPage() {
  const stats = await getAdminOverviewAction();
  const tickets = await supportService.getAllTicketsAdmin();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto font-sans">
          <div className="border-b border-border pb-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <LifeBuoy className="h-7 w-7 text-accent" /> Admin Support Desk
            </h1>
          </div>

          <div className="rounded-2xl border border-border bg-surface overflow-hidden font-mono text-xs shadow-xl">
            <div className="p-4 border-b border-border font-bold text-foreground bg-surface/40">
              Customer Support Tickets ({tickets.length})
            </div>

            <div className="divide-y divide-border/60">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground block">{t.subject}</span>
                    <span className="text-[10px] text-muted block mt-1">{t.category} · {new Date(t.createdAt).toLocaleString()}</span>
                  </div>

                  <Badge variant="outline" className="border-accent text-accent">
                    {t.status}
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
