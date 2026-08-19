"use client";

import * as React from "react";
import {
  Cpu,
  Plus,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  DollarSign,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateModelSettingsAction } from "@/app/actions/admin-actions";

interface ModelItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  creditCost: number;
  providerEstimatedCost: number;
  enabled: boolean;
  isDefault: boolean;
  isNew: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  requiredPlan: string;
  provider?: { name: string; slug: string } | null;
}

interface AdminModelsClientProps {
  initialModels: ModelItem[];
  providers: any[];
}

export function AdminModelsClient({ initialModels, providers }: AdminModelsClientProps) {
  const { showToast } = useToast();
  const [models, setModels] = React.useState<ModelItem[]>(initialModels);
  const [selectedModel, setSelectedModel] = React.useState<ModelItem | null>(null);

  // Edit Form State
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [creditCost, setCreditCost] = React.useState(8);
  const [providerCost, setProviderCost] = React.useState(0.05);
  const [enabled, setEnabled] = React.useState(true);
  const [isNew, setIsNew] = React.useState(false);
  const [isPopular, setIsPopular] = React.useState(false);
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [requiredPlan, setRequiredPlan] = React.useState("FREE");
  const [submitting, setSubmitting] = React.useState(false);

  const handleOpenEdit = (model: ModelItem) => {
    setSelectedModel(model);
    setName(model.name);
    setDescription(model.description);
    setCreditCost(model.creditCost);
    setProviderCost(model.providerEstimatedCost || 0.05);
    setEnabled(model.enabled);
    setIsNew(model.isNew || false);
    setIsPopular(model.isPopular || false);
    setIsFeatured(model.isFeatured || false);
    setRequiredPlan(model.requiredPlan || "FREE");
  };

  const handleUpdateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;

    setSubmitting(true);
    try {
      const res = await updateModelSettingsAction(selectedModel.id, {
        name,
        description,
        creditCost: Number(creditCost),
        providerEstimatedCost: Number(providerCost),
        enabled,
        isNew,
        isPopular,
        isFeatured,
        requiredPlan,
      });

      showToast(`Model '${name}' updated successfully!`, "success");

      setModels((prev) =>
        prev.map((m) => (m.id === selectedModel.id ? { ...m, ...res.model } : m))
      );

      setSelectedModel(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update model settings";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-6 w-6 text-accent" /> AI Model Engine Registry & Pricing
          </h1>
          <p className="text-xs text-muted mt-1 font-mono">
            Manage live AI generation models, enable/disable engines, configure credit pricing and monitor profit margins.
          </p>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {models.map((model) => {
          // Calculate estimated margin
          // Assuming 100 credits = $2.50 ($0.025 per credit)
          const revenueEstimate = model.creditCost * 0.025;
          const profit = revenueEstimate - (model.providerEstimatedCost || 0.05);
          const marginPct = revenueEstimate > 0 ? (profit / revenueEstimate) * 100 : 0;
          const isLowMargin = marginPct < 15;

          return (
            <div
              key={model.id}
              className={`rounded-2xl border p-6 space-y-4 transition-all ${
                model.enabled
                  ? "border-border bg-surface hover:border-accent/40"
                  : "border-border/50 bg-surface/40 opacity-70"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {model.enabled ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                      ● ONLINE & ENABLED
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-mono">
                      ○ DISABLED
                    </Badge>
                  )}
                  {model.isPopular && <Badge className="bg-accent text-accent-foreground text-[9px]">Popular</Badge>}
                  {model.isNew && <Badge variant="secondary" className="text-[9px]">New</Badge>}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(model)}
                  className="h-8 text-xs font-mono border-border"
                >
                  <Sliders className="h-3.5 w-3.5 mr-1" /> Configure
                </Button>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-bold text-foreground">{model.name}</h3>
                <div className="text-xs font-mono text-muted">Slug: {model.slug}</div>
                <p className="text-xs text-muted mt-2 leading-relaxed">{model.description}</p>
              </div>

              {/* Margin & Pricing Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-background rounded-xl border border-border text-xs font-mono">
                <div>
                  <div className="text-[10px] text-muted uppercase">CUSTOMER PRICE</div>
                  <div className="font-bold text-accent">{model.creditCost} CREDITS</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase">PROVIDER COST</div>
                  <div className="font-bold text-foreground">${model.providerEstimatedCost || 0.05}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase">ESTIMATED MARGIN</div>
                  <div className={`font-bold ${isLowMargin ? "text-destructive" : "text-emerald-400"}`}>
                    {marginPct.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Low Profit Margin Warning Alert (PART 9) */}
              {isLowMargin && model.enabled && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">WARNING:</span> This model currently has an estimated margin below 15%. Consider increasing customer credit pricing.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Model Edit Dialog */}
      {selectedModel && (
        <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
          <DialogContent className="max-w-lg bg-surface border-border text-foreground font-sans">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-lg font-bold">
                Configure Model — {selectedModel.name}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateModel} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted uppercase">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground focus:outline-none focus:border-accent resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-muted uppercase">Customer Credit Cost</label>
                  <input
                    type="number"
                    min={1}
                    value={creditCost}
                    onChange={(e) => setCreditCost(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl p-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-muted uppercase">Provider Cost (USD $)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={providerCost}
                    onChange={(e) => setProviderCost(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl p-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                    required
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-background cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="accent-[#c8ff00]"
                  />
                  <span className="text-xs font-mono font-bold">Enabled in Studio</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-background cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="accent-[#c8ff00]"
                  />
                  <span className="text-xs font-mono font-bold">Popular Badge</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedModel(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground font-bold text-xs">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Settings"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
