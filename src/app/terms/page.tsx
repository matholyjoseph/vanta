import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Terms of Service — VANTA AI",
  description: "Terms of Service and Usage Agreement for VANTA AI.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-border pb-6 space-y-2">
        <Badge variant="outline" className="border-amber-500 text-amber-400 font-mono text-xs">
          <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Requires legal review before production launch.
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <FileText className="h-7 w-7 text-accent" /> Terms of Service
        </h1>
        <p className="text-xs text-muted font-mono">Last updated: August 19, 2026</p>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Account Eligibility & Responsibilities</h2>
          <p>By creating a VANTA AI account, you agree to comply with all applicable copyright and intellectual property laws.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. AI Media Generation & Credits</h2>
          <p>Generations consume credits based on model complexity and resolution. Unused credits rollover according to plan rules.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Limitation of Liability</h2>
          <p>VANTA AI is provided "as is" without express warranties of uptime or provider availability.</p>
        </section>
      </div>
    </div>
  );
}
