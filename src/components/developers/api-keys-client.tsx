"use client";

import * as React from "react";
import Link from "next/link";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Shield,
  AlertTriangle,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createApiKeyAction,
  revokeApiKeyAction,
  rotateApiKeyAction,
} from "@/app/actions/developer-actions";
import { useToast } from "@/components/ui/toast";

export function ApiKeysClient({ initialKeys = [] }: { initialKeys: any[] }) {
  const { showToast } = useToast();
  const [keys, setKeys] = React.useState(initialKeys);

  const [isOpen, setIsOpen] = React.useState(false);
  const [keyName, setKeyName] = React.useState("");
  const [environment, setEnvironment] = React.useState<"LIVE" | "TEST">("LIVE");

  const [createdSecret, setCreatedSecret] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createApiKeyAction({
        name: keyName || "Untitled API Key",
        environment,
      });

      setCreatedSecret(res.plaintextKey);
      setKeys([res.apiKey, ...keys]);
      showToast("API Key created! Copy your key secret now.", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to create API key", "error");
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeApiKeyAction(keyId);
      setKeys(keys.map((k) => (k.id === keyId ? { ...k, status: "REVOKED" } : k)));
      showToast("API Key revoked", "info");
    } catch (err: any) {
      showToast(err?.message || "Failed to revoke key", "error");
    }
  };

  const handleRotateKey = async (keyId: string) => {
    try {
      const res = await rotateApiKeyAction(keyId);
      setCreatedSecret(res.plaintextKey);
      setKeys([res.apiKey, ...keys.map((k) => (k.id === keyId ? { ...k, status: "REVOKED" } : k))]);
      showToast("API Key rotated!", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to rotate key", "error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Copied to clipboard!", "success");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link href="/developers" className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
            ← Developer Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Key className="h-7 w-7 text-accent" /> API Keys & Access Tokens
          </h1>
          <p className="text-sm text-muted mt-1 font-mono">
            Manage Bearer API keys used for authenticating REST requests.
          </p>
        </div>

        <Button
          onClick={() => {
            setCreatedSecret(null);
            setKeyName("");
            setIsOpen(true);
          }}
          className="bg-accent text-accent-foreground font-bold text-xs h-11 px-6 rounded-xl cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" /> Create API Key
        </Button>
      </div>

      {/* API Keys Table */}
      <div className="rounded-2xl border border-border bg-surface/50 overflow-hidden font-mono text-xs">
        <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between bg-surface/40">
          <span>Active & Historical API Keys</span>
          <span className="text-[11px] text-muted">{keys.length} Keys Total</span>
        </div>

        {keys.length === 0 ? (
          <div className="p-12 text-center text-muted">
            No API keys found. Click "Create API Key" above to generate your first access token.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {keys.map((k) => (
              <div key={k.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{k.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono ${
                        k.environment === "LIVE" ? "border-accent text-accent" : "border-muted text-muted"
                      }`}
                    >
                      {k.environment}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono ${
                        k.status === "ACTIVE" ? "border-green-500 text-green-400" : "border-destructive text-destructive"
                      }`}
                    >
                      {k.status}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-muted flex items-center gap-2">
                    <code>{k.prefix}...{k.lastFour}</code>
                    <span>· Created {new Date(k.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {k.status === "ACTIVE" && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRotateKey(k.id)}
                        className="h-8 text-[11px] text-muted hover:text-foreground"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Rotate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeKey(k.id)}
                        className="h-8 text-[11px] text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Revoke
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Key Creation Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-[#09090b] border-border text-foreground font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-accent" /> Create New API Key
            </DialogTitle>
          </DialogHeader>

          {createdSecret ? (
            /* Show Secret Once Screen */
            <div className="space-y-4 font-mono text-xs pt-2">
              <div className="p-3 rounded-xl border border-accent/40 bg-accent/10 text-accent font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Save your key secret now. You will NOT be able to view it again.
              </div>

              <div className="space-y-1">
                <label className="text-muted block text-[10px] uppercase">API Key Secret</label>
                <div className="p-3 rounded-xl border border-border bg-background flex items-center justify-between gap-2">
                  <code className="text-accent text-[11px] break-all">{createdSecret}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(createdSecret)}
                    className="h-8 w-8 p-0 shrink-0 text-accent"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full bg-accent text-accent-foreground font-bold h-10 rounded-xl"
              >
                Done
              </Button>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleCreateKey} className="space-y-4 font-mono text-xs pt-2">
              <div className="space-y-1">
                <label className="text-muted block text-[10px] uppercase">Key Name</label>
                <input
                  type="text"
                  placeholder="e.g. Production Webhook Worker"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted block text-[10px] uppercase">Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground"
                >
                  <option value="LIVE">LIVE (Real Billings & Production Processing)</option>
                  <option value="TEST">TEST (Development Testing Keys)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent text-accent-foreground font-bold">
                  Generate Key Secret
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
