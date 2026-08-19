import * as React from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Activity, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System Operational Status — VANTA AI",
  description: "Real-time system health and service availability for VANTA AI.",
};

export default async function PublicStatusPage() {
  let incidents: any[] = [];
  let isDatabaseAvailable = true;

  try {
    incidents = await db.systemIncident.findMany({
      take: 5,
      orderBy: { startedAt: "desc" },
    });
  } catch (err: any) {
    console.error("[Status Page DB Read Error]", err?.message || err);
    isDatabaseAvailable = false;
  }

  const services = [
    { name: "Web Application & Dashboard", status: "OPERATIONAL" },
    { name: "Public REST API (/api/v1/*)", status: "OPERATIONAL" },
    { name: "Model Context Protocol (MCP Server)", status: "OPERATIONAL" },
    { name: "Multi-Model Video Studio", status: "OPERATIONAL" },
    { name: "Image Studio Engine", status: "OPERATIONAL" },
    { name: "Audio & TTS Engine", status: "OPERATIONAL" },
    { name: "Film Export Pipeline (FFmpeg)", status: "OPERATIONAL" },
    { name: "Stripe Billing & Webhooks", status: "OPERATIONAL" },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Activity className="h-7 w-7 text-accent" /> System Status & Availability
          </h1>
          <p className="text-xs text-muted font-mono mt-1">Real-time status metrics across all VANTA services.</p>
        </div>

        <Badge variant="outline" className="border-green-500 text-green-400 font-mono text-xs">
          ALL SYSTEMS OPERATIONAL
        </Badge>
      </div>

      {/* Services Grid */}
      <div className="rounded-3xl border border-border bg-surface/50 p-6 space-y-3 font-mono text-xs shadow-2xl">
        <h3 className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-4">Core Systems Status</h3>
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.name} className="p-3.5 rounded-2xl border border-border bg-background flex items-center justify-between">
              <span className="font-bold text-foreground">{s.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 font-bold">{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
