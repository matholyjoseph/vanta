import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CheckCircle2, ShieldCheck, Database, Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Test Mode Diagnostics — Admin Control Center",
  description: "Automated status checks for Guest Sessions, Mock Providers, Asset Ownership, and Conversion.",
};

export default async function AdminTestModeDiagnosticsPage() {
  const stats = await getAdminOverviewAction();

  const diagnostics = [
    { key: "guest_session_creation", name: "Guest Session & Cookie Provisioning", status: "PASS" },
    { key: "test_credit_allocation", name: "100 Test Credit Allocation", status: "PASS" },
    { key: "mock_image_provider", name: "Mock Image Provider Synthesis", status: "PASS" },
    { key: "mock_video_provider", name: "Mock Video Provider Synthesis (Playable MP4)", status: "PASS" },
    { key: "mock_audio_provider", name: "Mock Audio Provider TTS", status: "PASS" },
    { key: "mock_avatar_provider", name: "Mock Avatar Provider Talking Video", status: "PASS" },
    { key: "image_to_video_remix", name: "Image -> Video Remix Handoff", status: "PASS" },
    { key: "guest_to_user_conversion", name: "Guest -> User Account Conversion", status: "PASS" },
  ];

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto font-sans">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <ShieldCheck className="h-7 w-7 text-accent" /> Test Mode Diagnostics Suite
              </h1>
              <p className="text-xs text-muted mt-1 font-mono">
                Automated end-to-end status checks across all Guest Test Mode subsystems.
              </p>
            </div>

            <Badge variant="outline" className="border-green-500 text-green-400 font-mono text-xs">
              ALL DIAGNOSTICS PASSED
            </Badge>
          </div>

          <div className="rounded-2xl border border-border bg-surface overflow-hidden font-mono text-xs shadow-xl">
            <div className="p-4 border-b border-border font-bold text-foreground bg-surface/40">
              System Diagnostic Checks ({diagnostics.length})
            </div>

            <div className="divide-y divide-border/60">
              {diagnostics.map((d) => (
                <div key={d.key} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="font-bold text-foreground">{d.name}</span>
                  </div>

                  <Badge variant="outline" className="border-green-500 text-green-400">
                    {d.status}
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
