import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Smartphone, Save, ShieldAlert, Cpu, Zap, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Shorts Studio Settings — Admin Control Center",
  description: "Configure social clipping parameters, max video processing duration, and highlight models.",
};

export default async function AdminShortsPage() {
  const stats = await getAdminOverviewAction();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto font-sans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Smartphone className="h-7 w-7 text-accent" /> Shorts Studio Settings & Metrics
              </h1>
              <p className="text-xs text-muted mt-1 font-mono">
                Platform configurations for long-video processing limits, chunking duration, and viral highlight detection.
              </p>
            </div>

            <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5 cursor-pointer">
              <Save className="h-4 w-4 mr-2" /> Save Shorts Config
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            {/* General Shorts Controls */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                <Scissors className="h-4 w-4 text-accent" /> Ingestion & Processing Limits
              </h3>

              <div className="space-y-4 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-foreground block">Shorts Engine Enabled</label>
                    <span className="text-muted text-[10px]">Allow users to create Shorts projects</span>
                  </div>
                  <input type="checkbox" defaultChecked className="toggleAccent accent-accent h-4 w-4" />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Max Source Video Duration (Minutes)</label>
                  <input
                    type="number"
                    defaultValue={90}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Transcript Chunk Size (Seconds)</label>
                  <input
                    type="number"
                    defaultValue={180}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Default Highlight Candidates Count</label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* AI Model & Reframe Settings */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                <Cpu className="h-4 w-4 text-accent" /> Highlight Detection Model
              </h3>

              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Highlight Scoring Strategy</label>
                  <select defaultValue="BALANCED" className="w-full rounded-xl border border-border bg-background p-2.5 text-xs">
                    <option value="BALANCED">Balanced (Hook Strength + Story Payoff)</option>
                    <option value="HOOK_HEAVY">Hook Heavy (First 3s Impact)</option>
                    <option value="INSIGHT_HEAVY">Insight Heavy (Educational Density)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Default Social Reframe Strategy</label>
                  <select defaultValue="AUTO_REFRAME" className="w-full rounded-xl border border-border bg-background p-2.5 text-xs">
                    <option value="AUTO_REFRAME">Auto Subject Tracking</option>
                    <option value="CENTER_CROP">Static Center Crop</option>
                    <option value="BLURRED_BACKGROUND">Blurred Background Letterbox</option>
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
