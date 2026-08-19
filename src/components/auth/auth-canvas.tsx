import * as React from "react";
import Link from "next/link";
import { Clapperboard, Sparkles, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AuthCanvas() {
  return (
    <div className="relative hidden lg:flex h-full flex-col justify-between p-12 overflow-hidden border-r border-border bg-[#050608]">
      {/* Background Subtle Glow & Grid */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-accent/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Top Brand Header */}
      <div className="relative z-10 flex items-center space-x-3">
        <Link href="/" className="flex items-center space-x-2">
          <Clapperboard className="h-7 w-7 rotate-12 text-accent" />
          <span className="font-extrabold text-2xl tracking-tight text-foreground">
            Vanta AI
          </span>
        </Link>
        <Badge variant="outline" className="bg-surface text-accent border-accent/30 font-mono text-[10px]">
          v2.4 PRO
        </Badge>
      </div>

      {/* Center Cinematic Feature Preview Card */}
      <div className="relative z-10 my-auto max-w-lg space-y-6">
        <div className="relative aspect-video w-full rounded-2xl border border-accent/30 bg-surface shadow-[0_0_35px_rgba(200,255,0,0.12)] overflow-hidden p-6 flex flex-col justify-between group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a121d] via-[#102030] to-[#080d16]" />

          <div className="relative z-10 flex items-center justify-between font-mono text-[10px] text-accent">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
              NOVA VIDEO PRO ENGINE
            </span>
            <span className="text-white/40 uppercase">4K UHD · 60FPS</span>
          </div>

          <div className="relative z-10 space-y-2">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight leading-tight">
              Create Without Limits.
            </h2>
            <p className="text-xs text-muted leading-relaxed font-sans">
              Orchestrate multi-model AI video generation with precision motion control, consistent character consistency, and studio-grade cinematography.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-muted pt-2 border-t border-white/10">
            <span className="flex items-center gap-1 text-accent">
              <Sparkles className="h-3.5 w-3.5" /> MULTI-MODEL SYNTHESIS
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> COMMERCIAL LICENSED
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Quote */}
      <div className="relative z-10 font-mono text-xs text-muted flex items-center justify-between">
        <span>© 2024 Vanta AI Workspace.</span>
        <span className="text-accent">Powered by Next.js & Prisma</span>
      </div>
    </div>
  );
}
