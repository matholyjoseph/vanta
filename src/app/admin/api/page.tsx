import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Code2, Save, ShieldAlert, Cpu, Key, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "API Platform Controls — Admin Control Center",
  description: "Configure API rate limits, user key controls, feature flags, and webhook health.",
};

export default async function AdminApiPage() {
  const stats = await getAdminOverviewAction();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto font-sans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Code2 className="h-7 w-7 text-accent" /> API Platform Controls & Tiers
              </h1>
              <p className="text-xs text-muted mt-1 font-mono">
                Admin controls for rate limit tiers, feature flags, and developer access.
              </p>
            </div>

            <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5 cursor-pointer">
              <Save className="h-4 w-4 mr-2" /> Save Admin Config
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <Key className="h-4 w-4 text-accent" /> Rate Limit Tiers
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-2.5 rounded-xl border border-border bg-background">
                  <span>STANDARD Tier Limit</span>
                  <span className="font-bold text-accent">100 Req / Min</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl border border-border bg-background">
                  <span>PRO Tier Limit</span>
                  <span className="font-bold text-accent">500 Req / Min</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl border border-border bg-background">
                  <span>ENTERPRISE Tier Limit</span>
                  <span className="font-bold text-accent">2,500 Req / Min</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4 text-accent" /> Public Endpoint Feature Flags
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Public REST API Enabled</span>
                  <input type="checkbox" defaultChecked className="accent-accent h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Outbound Webhooks Engine</span>
                  <input type="checkbox" defaultChecked className="accent-accent h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Director Public API</span>
                  <input type="checkbox" defaultChecked className="accent-accent h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ToastProvider>
  );
}
