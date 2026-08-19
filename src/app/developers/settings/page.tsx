import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Settings, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Developer Settings — Developer Portal",
  description: "Configure default API versions, alerts, and low-credit notifications.",
};

export default function SettingsPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-4xl mx-auto font-sans">
        <div className="border-b border-border pb-6 flex items-center justify-between">
          <div>
            <Link href="/developers" className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
              ← Developer Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Settings className="h-7 w-7 text-accent" /> Developer Platform Settings
            </h1>
          </div>

          <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5">
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-surface/50 p-6 space-y-6 font-mono text-xs">
          <div className="space-y-1">
            <label className="font-bold text-foreground block uppercase text-[10px]">Default API Version</label>
            <select defaultValue="v1" className="w-full rounded-xl border border-border bg-background p-2.5">
              <option value="v1">v1 (Current Production Stable)</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <span className="font-bold text-foreground block">Low Credit Usage Alert</span>
              <span className="text-muted text-[10px]">Receive email notifications when credit balance falls below 100 credits</span>
            </div>
            <input type="checkbox" defaultChecked className="accent-accent h-4 w-4" />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
