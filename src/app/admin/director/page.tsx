import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Sparkles, Save, ShieldAlert, Cpu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "AI Director Settings — Admin Control Center",
  description: "Configure autonomous agent limits, model preferences, and budget behavior.",
};

export default async function AdminDirectorPage() {
  const stats = await getAdminOverviewAction();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto font-sans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Sparkles className="h-7 w-7 text-accent" /> AI Director Operational Settings
              </h1>
              <p className="text-xs text-muted mt-1 font-mono">
                Platform settings for AI Director Agent Mode task concurrency, spending safeguards, and model routing rules.
              </p>
            </div>

            <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5 cursor-pointer">
              <Save className="h-4 w-4 mr-2" /> Save Director Config
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Agent Settings */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                <Zap className="h-4 w-4 text-accent" /> Agent Controls
              </h3>

              <div className="space-y-4 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-foreground block">Director Engine Enabled</label>
                    <span className="text-muted text-[10px]">Allow users to launch AI Director runs</span>
                  </div>
                  <input type="checkbox" defaultChecked className="toggleAccent accent-accent h-4 w-4" />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Max Tasks Per Run</label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Max Planned Shots Per Run</label>
                  <input
                    type="number"
                    defaultValue={12}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Max Parallel Task Concurrency</label>
                  <input
                    type="number"
                    defaultValue={3}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Model Routing & Quality Settings */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                <Cpu className="h-4 w-4 text-accent" /> Model Preference Routing
              </h3>

              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Economy Model Strategy</label>
                  <select defaultValue="fal-flux-schnell" className="w-full rounded-xl border border-border bg-background p-2.5 text-xs">
                    <option value="fal-flux-schnell">Prefer fal.ai Schnell & Fast Motion</option>
                    <option value="vanta-motion-fast">Native Vanta Motion Fast</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Premium Model Strategy</label>
                  <select defaultValue="fal-luma-dream-machine" className="w-full rounded-xl border border-border bg-background p-2.5 text-xs">
                    <option value="fal-luma-dream-machine">fal.ai Luma Dream Machine & FLUX Pro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Default Spending Safeguard Checkpoint</label>
                  <select defaultValue="ASK" className="w-full rounded-xl border border-border bg-background p-2.5 text-xs">
                    <option value="ASK">Always Require User Approval (Recommended)</option>
                    <option value="USE_AVAILABLE">Auto-Approve Up To Wallet Balance</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ToastProvider>
  );
}
