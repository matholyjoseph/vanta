import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Bot, Save, ShieldAlert, Cpu, Power, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "MCP Platform Controls — Admin Control Center",
  description: "Admin metrics for MCP agent connections, tool controls, and Global Kill Switch.",
};

export default async function AdminMcpPage() {
  const stats = await getAdminOverviewAction();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto font-sans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Bot className="h-7 w-7 text-accent" /> MCP Server Admin Controls & Kill Switch
              </h1>
              <p className="text-xs text-muted mt-1 font-mono">
                Global emergency controls, tool permissions, and client agent metrics.
              </p>
            </div>

            <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5 cursor-pointer">
              <Save className="h-4 w-4 mr-2" /> Save MCP Admin Config
            </Button>
          </div>

          {/* Global Kill Switch Alert */}
          <div className="p-6 rounded-2xl border border-destructive/40 bg-destructive/10 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-destructive flex items-center gap-2 text-sm uppercase">
                <Power className="h-5 w-5" /> Emergency Global MCP Kill Switch
              </span>
              <input type="checkbox" className="accent-destructive h-5 w-5 cursor-pointer" />
            </div>
            <p className="text-muted text-[11px]">
              Checking this box immediately halts all external AI agent tool calls across ChatGPT, Claude, and IDE clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <Cpu className="h-4 w-4 text-accent" /> Tool Permissions & Limits
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>AI Director Produce Tool</span>
                  <input type="checkbox" defaultChecked className="accent-accent h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Video Generation Tools</span>
                  <input type="checkbox" defaultChecked className="accent-accent h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Image Generation Tools</span>
                  <input type="checkbox" defaultChecked className="accent-accent h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4 text-accent" /> Confirmation Thresholds
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Mandatory Confirmation Credit Threshold</label>
                  <input
                    type="number"
                    defaultValue={100}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ToastProvider>
  );
}
