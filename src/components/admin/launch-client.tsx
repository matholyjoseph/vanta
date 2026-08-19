"use client";

import * as React from "react";
import { Rocket, CheckCircle2, AlertTriangle, ShieldCheck, Database, RefreshCw, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateLaunchCheckAction } from "@/app/actions/launch-actions";
import { useToast } from "@/components/ui/toast";

export function LaunchClient({ initialChecklist = [] }: { initialChecklist: any[] }) {
  const { showToast } = useToast();
  const [checklist, setChecklist] = React.useState(initialChecklist);

  const handleStatusChange = async (key: string, newStatus: string) => {
    try {
      const updated = await updateLaunchCheckAction(key, newStatus);
      setChecklist(checklist.map((c) => (c.key === key ? updated : c)));
      showToast(`Updated '${key}' status to ${newStatus}`, "info");
    } catch (err: any) {
      showToast(err?.message || "Failed to update check status", "error");
    }
  };

  const passCount = checklist.filter((c) => c.status === "PASS").length;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Rocket className="h-7 w-7 text-accent" /> Launch Readiness Command Center
          </h1>
          <p className="text-xs text-muted mt-1 font-mono">
            Mandatory production launch checks (Security, Backups, Restore, Payments, Email, Monitoring).
          </p>
        </div>

        <Badge variant="outline" className="border-accent text-accent font-mono text-xs">
          {passCount} / {checklist.length} CHECKS PASSED
        </Badge>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden font-mono text-xs shadow-xl">
        <div className="p-4 border-b border-border font-bold text-foreground bg-surface/40">
          Pre-Launch Gate Checklist
        </div>

        <div className="divide-y divide-border/60">
          {checklist.map((c) => (
            <div key={c.key} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{c.key}</span>
                  <Badge variant="outline" className="border-border text-muted">
                    {c.category}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted font-sans mt-0.5">{c.notes}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={c.status}
                  onChange={(e) => handleStatusChange(c.key, e.target.value)}
                  className="bg-background border border-border rounded-xl px-3 py-1.5 font-bold text-accent text-xs cursor-pointer"
                >
                  <option value="NOT_STARTED">NOT_STARTED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="WAIVED">WAIVED</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
