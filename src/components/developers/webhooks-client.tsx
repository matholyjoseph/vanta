"use client";

import * as React from "react";
import Link from "next/link";
import {
  Webhook,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createWebhookEndpointAction,
  sendTestWebhookEventAction,
} from "@/app/actions/developer-actions";
import { useToast } from "@/components/ui/toast";

export function WebhooksClient({ initialEndpoints = [] }: { initialEndpoints: any[] }) {
  const { showToast } = useToast();
  const [endpoints, setEndpoints] = React.useState(initialEndpoints);

  const [isOpen, setIsOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [createdSecret, setCreatedSecret] = React.useState<string | null>(null);

  const handleCreateEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createWebhookEndpointAction({
        url,
        description,
        events: ["generation.queued", "generation.completed", "asset.created", "director.completed"],
      });

      setCreatedSecret(res.signingSecret);
      setEndpoints([res.endpoint, ...endpoints]);
      showToast("Webhook endpoint registered!", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to add endpoint", "error");
    }
  };

  const handleSendTestEvent = async (endpointId: string) => {
    showToast("Sending test HMAC-SHA256 webhook event...", "info");
    try {
      const res = await sendTestWebhookEventAction(endpointId);
      if (res.success) {
        showToast(`Test webhook delivered successfully! (HTTP ${res.statusCode})`, "success");
      } else {
        showToast(`Delivery failed: ${res.error || `HTTP ${res.statusCode}`}`, "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Test event failed", "error");
    }
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
            <Webhook className="h-7 w-7 text-accent" /> Outbound Webhooks & Events
          </h1>
          <p className="text-sm text-muted mt-1 font-mono">
            Receive signed HTTP POST notifications (`X-Vanta-Signature`) when generation jobs finish.
          </p>
        </div>

        <Button onClick={() => setIsOpen(true)} className="bg-accent text-accent-foreground font-bold text-xs h-11 px-6 rounded-xl cursor-pointer">
          <Plus className="h-4 w-4 mr-2" /> Add Endpoint
        </Button>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {endpoints.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted font-mono text-xs">
            No webhook endpoints registered yet. Click "Add Endpoint" to receive real-time event notifications.
          </div>
        ) : (
          endpoints.map((ep) => (
            <div key={ep.id} className="p-6 rounded-2xl border border-border bg-surface/50 space-y-4 font-mono text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{ep.url}</span>
                    <Badge variant="outline" className="border-accent text-accent">
                      {ep.status}
                    </Badge>
                  </div>
                  {ep.description && <p className="text-muted text-[11px]">{ep.description}</p>}
                </div>

                <Button size="sm" variant="outline" onClick={() => handleSendTestEvent(ep.id)} className="border-border">
                  <Send className="h-3.5 w-3.5 mr-1 text-accent" /> Send Test Event
                </Button>
              </div>

              {/* Delivery History Log */}
              <div className="space-y-2">
                <span className="text-[10px] text-muted uppercase tracking-wider block">Recent Deliveries</span>
                {(ep.deliveries || []).length === 0 ? (
                  <span className="text-[11px] text-muted italic">No delivery attempts yet.</span>
                ) : (
                  <div className="space-y-1.5">
                    {ep.deliveries.slice(0, 3).map((d: any) => (
                      <div key={d.id} className="p-2 rounded-xl border border-border/70 bg-background flex items-center justify-between text-[11px]">
                        <span className="text-accent font-bold">{d.eventType}</span>
                        <span className={d.status === "DELIVERED" ? "text-green-400 font-bold" : "text-destructive font-bold"}>
                          {d.status} ({d.responseCode ? `HTTP ${d.responseCode}` : d.error})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Endpoint Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-[#09090b] border-border text-foreground font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Webhook className="h-5 w-5 text-accent" /> Add Webhook Endpoint
            </DialogTitle>
          </DialogHeader>

          {createdSecret ? (
            <div className="space-y-4 font-mono text-xs pt-2">
              <div className="p-3 rounded-xl border border-accent/40 bg-accent/10 text-accent font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> Endpoint registered! Store your signing secret.
              </div>

              <div className="space-y-1">
                <label className="text-muted block text-[10px] uppercase">HMAC Signing Secret</label>
                <div className="p-3 rounded-xl border border-border bg-background flex items-center justify-between">
                  <code className="text-accent text-[11px]">{createdSecret}</code>
                </div>
              </div>

              <Button onClick={() => setIsOpen(false)} className="w-full bg-accent text-accent-foreground font-bold h-10 rounded-xl">
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreateEndpoint} className="space-y-4 font-mono text-xs pt-2">
              <div className="space-y-1">
                <label className="text-muted block text-[10px] uppercase">Endpoint URL</label>
                <input
                  type="url"
                  placeholder="https://your-domain.com/api/vanta-webhook"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted block text-[10px] uppercase">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Production Webhook Listener"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent text-accent-foreground font-bold">
                  Save Endpoint
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
