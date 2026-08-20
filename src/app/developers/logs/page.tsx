import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Search, Filter, Terminal, Clock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getApiRequestLogsAction } from "@/app/actions/developer-actions";
import { ToastProvider } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "API Request Logs — Developer Portal",
  description: "Inspect API request logs, status codes, latency, and credit usage.",
};

export default async function RequestLogsPage() {
  const logs = await getApiRequestLogsAction();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <Link href="/developers" className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
            ← Developer Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Activity className="h-7 w-7 text-accent" /> API Request & Security Logs
          </h1>
          <p className="text-sm text-muted mt-1 font-mono">
            Inspect real-time REST request logs, status codes, duration, and credit consumption.
          </p>
        </div>

        {/* Request Logs Table */}
        <div className="rounded-2xl border border-border bg-surface/50 overflow-hidden font-mono text-xs">
          <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between bg-surface/40">
            <span>Recent API Requests</span>
            <span className="text-[11px] text-muted">{logs.length} Requests Recorded</span>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center text-muted">
              No API requests recorded yet. Make a request using your API Key to view logs here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase text-muted bg-background/50">
                    <th className="p-3">Status</th>
                    <th className="p-3">Method & Path</th>
                    <th className="p-3">Request ID</th>
                    <th className="p-3">Latency</th>
                    <th className="p-3">Credits</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface/80 transition-colors">
                      <td className="p-3 font-bold">
                        <Badge
                          variant="outline"
                          className={log.statusCode < 300 ? "border-green-500 text-green-400" : "border-destructive text-destructive"}
                        >
                          {log.statusCode}
                        </Badge>
                      </td>
                      <td className="p-3 font-bold text-foreground">
                        {log.method} {log.path}
                      </td>
                      <td className="p-3 text-muted text-[11px]">{log.requestId}</td>
                      <td className="p-3 text-accent">{log.durationMs}ms</td>
                      <td className="p-3 font-bold">{log.creditsUsed} Credits</td>
                      <td className="p-3 text-muted text-[11px]">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
