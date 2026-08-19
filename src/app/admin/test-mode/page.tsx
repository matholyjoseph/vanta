import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Sparkles, Shield, RefreshCw, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Test Mode Admin — Admin Control Center",
  description: "Configure Guest Test Mode, Mock Providers, and diagnostic checks.",
};

export default async function AdminTestModePage() {
  const stats = await getAdminOverviewAction();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto font-sans">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Sparkles className="h-7 w-7 text-accent" /> Test Mode & Mock Providers Configuration
              </h1>
              <p className="text-xs text-muted mt-1 font-mono">
                System-wide Guest Mode settings, Test Credits, and provider modes.
              </p>
            </div>

            <Link href="/admin/test-mode/diagnostics">
              <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5">
                <RefreshCw className="h-4 w-4 mr-2" /> Run Test Mode Diagnostics
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="p-6 rounded-3xl border border-border bg-surface/50 space-y-4 shadow-xl">
              <span className="font-bold text-foreground block text-sm">Guest Test Mode</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                  <span>Guest Mode Status:</span>
                  <Badge variant="outline" className="border-green-500 text-green-400 font-bold">
                    ENABLED
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                  <span>Default Test Credits:</span>
                  <span className="font-bold text-accent">100 CREDITS</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                  <span>Session Expiry Window:</span>
                  <span className="font-bold text-foreground">24 HOURS</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-border bg-surface/50 space-y-4 shadow-xl">
              <span className="font-bold text-foreground block text-sm">Provider Routing Mode</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                  <span>Generation Mode:</span>
                  <Badge variant="outline" className="border-accent text-accent font-bold">
                    MOCK (ZERO COST)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                  <span>Mock Failure Simulation Rate:</span>
                  <span className="font-bold text-foreground">0.0% (DISABLED)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ToastProvider>
  );
}
