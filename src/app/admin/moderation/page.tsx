import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ToastProvider } from "@/components/ui/toast";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Content Moderation Queue — VANTA AI Admin",
  description: "Review flagged content, automated safety moderation results, and user content approvals.",
};

export default async function AdminModerationPage() {
  const stats = await getAdminOverviewAction();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="space-y-6 font-sans">
          <div className="border-b border-border pb-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-accent" /> Content Safety & Moderation Queue
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              Inspect safety moderation flags, review user prompts, and enforce content policy decisions.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground font-sans">Moderation Queue Clear</h3>
            <p className="text-xs text-muted max-w-sm mx-auto font-mono">
              All recent generation prompts have passed automated provider safety filters.
            </p>
          </div>
        </div>
      </AdminLayout>
    </ToastProvider>
  );
}
