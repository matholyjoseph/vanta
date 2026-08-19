import * as React from "react";
import type { Metadata } from "next";
import { ShieldAlert, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — VANTA AI",
  description: "Guidelines and content policies for VANTA AI platform users.",
};

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-border pb-6 space-y-2">
        <Badge variant="outline" className="border-amber-500 text-amber-400 font-mono text-xs">
          <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Requires legal review before production launch.
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <Shield className="h-7 w-7 text-accent" /> Acceptable Use Policy
        </h1>
      </div>

      <p className="text-sm text-muted-foreground font-sans">
        Users may not generate non-consensual deepfakes, violent content, CSAM, or deceptive media.
      </p>
    </div>
  );
}
