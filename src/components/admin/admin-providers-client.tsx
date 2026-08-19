"use client";

import * as React from "react";
import { Radio, ShieldCheck, AlertTriangle, XCircle, Power, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { updateProviderStatusAction, testProviderConnectionAction } from "@/app/actions/admin-actions";

interface ProviderItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  enabled: boolean;
  models?: any[];
}

interface AdminProvidersClientProps {
  providers: ProviderItem[];
}

export function AdminProvidersClient({ providers: initialProviders }: AdminProvidersClientProps) {
  const { showToast } = useToast();
  const [providers, setProviders] = React.useState<ProviderItem[]>(initialProviders);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [testingSlug, setTestingSlug] = React.useState<string | null>(null);

  const handleToggleStatus = async (providerId: string, newStatus: string, enabled: boolean) => {
    setUpdatingId(providerId);
    try {
      const res = await updateProviderStatusAction(providerId, newStatus, enabled);
      showToast(`Provider status updated to ${newStatus}`, "success");
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, status: newStatus, enabled } : p))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update provider status";
      showToast(msg, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTestConnection = async (slug: string) => {
    setTestingSlug(slug);
    try {
      const res = await testProviderConnectionAction(slug);
      if (res.success) {
        showToast(res.message, "success");
      } else {
        showToast(res.message, "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection test failed";
      showToast(msg, "error");
    } finally {
      setTestingSlug(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Radio className="h-6 w-6 text-accent" /> AI Render Providers & Health Monitoring
          </h1>
          <p className="text-xs text-muted mt-1 font-mono">
            Monitor API endpoints, request latency, success rates, and manage provider status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((provider) => (
          <div key={provider.id} className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className={`text-xs font-mono font-bold ${
                  provider.status === "ONLINE"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : provider.status === "DEGRADED"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-destructive/10 text-destructive border-destructive/30"
                }`}
              >
                ● {provider.status}
              </Badge>
              <div className="text-xs font-mono text-muted">Slug: {provider.slug}</div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">{provider.name}</h3>
              <p className="text-xs text-muted font-mono mt-1">
                Connected Models: {provider.models?.length || 0}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant={provider.status === "ONLINE" ? "default" : "outline"}
                disabled={updatingId === provider.id}
                onClick={() => handleToggleStatus(provider.id, "ONLINE", true)}
                className="text-xs font-mono"
              >
                {updatingId === provider.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Set ONLINE"}
              </Button>
              <Button
                size="sm"
                variant={provider.status === "DEGRADED" ? "secondary" : "outline"}
                disabled={updatingId === provider.id}
                onClick={() => handleToggleStatus(provider.id, "DEGRADED", true)}
                className="text-xs font-mono"
              >
                Set DEGRADED
              </Button>
              <Button
                size="sm"
                variant={provider.status === "OFFLINE" ? "destructive" : "outline"}
                disabled={updatingId === provider.id}
                onClick={() => handleToggleStatus(provider.id, "OFFLINE", false)}
                className="text-xs font-mono"
              >
                Set OFFLINE
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={testingSlug === provider.slug}
                onClick={() => handleTestConnection(provider.slug)}
                className="text-xs font-mono border-accent/40 text-accent hover:bg-accent/10"
              >
                {testingSlug === provider.slug ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                )}
                Test Connection
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
