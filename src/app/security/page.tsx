import * as React from "react";
import type { Metadata } from "next";
import { ShieldCheck, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Security & Vulnerability Reporting — VANTA AI",
  description: "Security architecture, encryption standards, and responsible disclosure policy.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-border pb-6 space-y-2">
        <Badge variant="outline" className="border-accent text-accent font-mono text-xs">
          PRODUCTION HARDENED
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <Lock className="h-7 w-7 text-accent" /> Security Overview & Vulnerability Reporting
        </h1>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">Responsible Vulnerability Disclosure</h2>
          <p>
            If you discover a security vulnerability in VANTA AI, please report it to{" "}
            <code className="text-accent font-mono">security@vanta.ai</code>. We respond within 24 hours.
          </p>
        </section>
      </div>
    </div>
  );
}
