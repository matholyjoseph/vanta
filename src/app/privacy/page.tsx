import * as React from "react";
import type { Metadata } from "next";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Privacy Policy — VANTA AI",
  description: "Privacy Policy detailing data collection, encryption, and user rights.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-border pb-6 space-y-2">
        <Badge variant="outline" className="border-amber-500 text-amber-400 font-mono text-xs">
          <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Requires legal review before production launch.
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-accent" /> Privacy Policy
        </h1>
        <p className="text-xs text-muted font-mono">Last updated: August 19, 2026</p>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Information We Collect</h2>
          <p>We collect account email addresses, payment metadata, generation prompts, and user-uploaded media assets.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Data Retention & Deletion</h2>
          <p>Users may request permanent account deletion at any time through Account Settings.</p>
        </section>
      </div>
    </div>
  );
}
