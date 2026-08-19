"use client";

import * as React from "react";
import { Sliders, ToggleLeft, ToggleRight, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { toggleFeatureFlagAction } from "@/app/actions/admin-actions";

interface FlagItem {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface AdminSettingsClientProps {
  featureFlags: FlagItem[];
  systemSettings: any[];
}

export function AdminSettingsClient({ featureFlags: initialFlags }: AdminSettingsClientProps) {
  const { showToast } = useToast();
  const [flags, setFlags] = React.useState<FlagItem[]>(initialFlags);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const handleToggleFlag = async (flagId: string, enabled: boolean) => {
    setUpdatingId(flagId);
    try {
      const res = await toggleFeatureFlagAction(flagId, enabled);
      showToast(`Feature flag '${res.flag.name}' ${enabled ? "enabled" : "disabled"}`, "success");
      setFlags((prev) => prev.map((f) => (f.id === flagId ? { ...f, enabled } : f)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle feature flag";
      showToast(msg, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sliders className="h-6 w-6 text-accent" /> System Settings & Feature Flags
        </h1>
        <p className="text-xs text-muted mt-1 font-mono">
          Toggle operational feature flags, enable maintenance mode, and manage platform defaults.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sliders className="h-5 w-5 text-accent" /> Operational Feature Flags
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="p-5 rounded-2xl border border-border bg-surface flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span>{flag.name}</span>
                  <Badge variant="outline" className="text-[10px] font-mono text-muted">
                    {flag.key}
                  </Badge>
                </div>
                <p className="text-xs text-muted">{flag.description}</p>
              </div>

              <button
                onClick={() => handleToggleFlag(flag.id, !flag.enabled)}
                disabled={updatingId === flag.id}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                {updatingId === flag.id ? (
                  <Loader2 className="h-6 w-6 text-accent animate-spin" />
                ) : flag.enabled ? (
                  <ToggleRight className="h-8 w-8 text-accent" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-muted" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
