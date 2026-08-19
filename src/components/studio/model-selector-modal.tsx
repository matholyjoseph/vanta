"use client";

import * as React from "react";
import {
  Search,
  Sparkles,
  Zap,
  Star,
  Check,
  Sliders,
  Radio,
  Clock,
  Layers,
  Volume2,
  ShieldCheck,
  X,
  Scale,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toggleUserFavoriteModelAction } from "@/app/actions/model-actions";
import { useToast } from "@/components/ui/toast";

export interface StudioModelItem {
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
  speedTier: string; // "Fast" | "Balanced" | "Quality"
  supportedModes: string[];
  supportedDurations: string[];
  supportedResolutions: string[];
  supportedAspectRatios: string[];
  supportsAudio: boolean;
  supportsImageReference: boolean;
  supportsVideoReference: boolean;
  supportsStartEndFrame: boolean;
  supportsMotionControl: boolean;
  isFavorite?: boolean;
  isRecent?: boolean;
  provider?: { name: string; slug: string; status: string } | null;
}

interface ModelSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: StudioModelItem[];
  selectedModelId: string;
  onSelectModel: (model: StudioModelItem) => void;
}

export function ModelSelectorModal({
  open,
  onOpenChange,
  models,
  selectedModelId,
  onSelectModel,
}: ModelSelectorModalProps) {
  const { showToast } = useToast();
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<string>("ALL");
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(
    new Set(models.filter((m) => m.isFavorite).map((m) => m.id))
  );
  const [compareIds, setCompareIds] = React.useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = React.useState(false);
  const [inspectModel, setInspectModel] = React.useState<StudioModelItem | null>(null);

  // Filter Logic
  const filteredModels = models.filter((model) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      model.name.toLowerCase().includes(q) ||
      model.description.toLowerCase().includes(q) ||
      model.speedTier.toLowerCase().includes(q) ||
      model.supportedModes.some((m) => m.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeTab === "FAVORITES") return favoriteIds.has(model.id);
    if (activeTab === "RECENT") return model.isRecent;
    if (activeTab === "TEXT_TO_VIDEO") return model.supportedModes.includes("text-to-video");
    if (activeTab === "IMAGE_TO_VIDEO") return model.supportedModes.includes("image-to-video");
    if (activeTab === "MOTION") return model.supportsMotionControl;
    if (activeTab === "AUDIO") return model.supportsAudio;
    if (activeTab === "FAST") return model.speedTier === "Fast";
    if (activeTab === "QUALITY") return model.speedTier === "Quality";

    return true;
  });

  // Recommender Preset Rule Handler (PART 32)
  const handleApplyPreset = (preset: string) => {
    if (preset === "FASTEST") {
      const fast = models.find((m) => m.speedTier === "Fast") || models[0];
      if (fast) onSelectModel(fast);
    } else if (preset === "QUALITY") {
      const qual = models.find((m) => m.speedTier === "Quality") || models[0];
      if (qual) onSelectModel(qual);
    } else if (preset === "CHEAPEST") {
      const sorted = [...models].sort((a, b) => a.creditCost - b.creditCost);
      if (sorted[0]) onSelectModel(sorted[0]);
    } else if (preset === "IMAGE_ANIMATION") {
      const imgMod = models.find((m) => m.supportsImageReference) || models[0];
      if (imgMod) onSelectModel(imgMod);
    }
    onOpenChange(false);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, modelId: string) => {
    e.stopPropagation();
    try {
      const res = await toggleUserFavoriteModelAction(modelId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (res.isFavorite) next.add(modelId);
        else next.delete(modelId);
        return next;
      });
      showToast(res.isFavorite ? "Added model to favorites" : "Removed from favorites", "info");
    } catch {
      showToast("Please sign in to save favorite models", "error");
    }
  };

  const handleToggleCompare = (e: React.MouseEvent, modelId: string) => {
    e.stopPropagation();
    setCompareIds((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      if (prev.length >= 3) {
        showToast("You can compare up to 3 models at a time", "error");
        return prev;
      }
      return [...prev, modelId];
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-[#09090b] border-border text-foreground font-sans p-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-6 border-b border-border space-y-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 font-mono">
                <Sparkles className="h-5 w-5 text-accent" /> AI Generation Engine Registry
              </DialogTitle>

              {compareIds.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setShowCompareModal(true)}
                  className="bg-accent text-accent-foreground font-mono text-xs font-bold h-8"
                >
                  <Scale className="h-3.5 w-3.5 mr-1.5" /> Compare ({compareIds.length}/3)
                </Button>
              )}
            </div>

            {/* Recommender Quick Presets (PART 32) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
              <span className="text-muted text-[10px] uppercase font-bold shrink-0">RECOMMENDER:</span>
              <button
                onClick={() => handleApplyPreset("FASTEST")}
                className="px-2.5 py-1 rounded-lg border border-border bg-surface hover:border-accent text-muted hover:text-foreground text-[11px] shrink-0"
              >
                ⚡ Fastest Render
              </button>
              <button
                onClick={() => handleApplyPreset("QUALITY")}
                className="px-2.5 py-1 rounded-lg border border-border bg-surface hover:border-accent text-muted hover:text-foreground text-[11px] shrink-0"
              >
                ✨ Best Quality
              </button>
              <button
                onClick={() => handleApplyPreset("CHEAPEST")}
                className="px-2.5 py-1 rounded-lg border border-border bg-surface hover:border-accent text-muted hover:text-foreground text-[11px] shrink-0"
              >
                💰 Lowest Cost
              </button>
              <button
                onClick={() => handleApplyPreset("IMAGE_ANIMATION")}
                className="px-2.5 py-1 rounded-lg border border-border bg-surface hover:border-accent text-muted hover:text-foreground text-[11px] shrink-0"
              >
                🎨 Image Animation
              </button>
            </div>

            {/* Search & Tabs Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search model name, resolution, motion..."
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1">
                {[
                  { id: "ALL", label: "All" },
                  { id: "FAVORITES", label: "Favorites" },
                  { id: "TEXT_TO_VIDEO", label: "Text to Video" },
                  { id: "IMAGE_TO_VIDEO", label: "Image to Video" },
                  { id: "MOTION", label: "Motion Control" },
                  { id: "AUDIO", label: "Audio" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all shrink-0 ${
                      activeTab === tab.id
                        ? "bg-accent/15 text-accent border border-accent/40"
                        : "text-muted hover:text-foreground hover:bg-surface border border-transparent"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Model Grid */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredModels.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted font-mono text-xs">
                No AI models match search criteria.
              </div>
            ) : (
              filteredModels.map((model) => {
                const isSelected = selectedModelId === model.id;
                const isFav = favoriteIds.has(model.id);
                const isComp = compareIds.includes(model.id);

                return (
                  <div
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model);
                      onOpenChange(false);
                    }}
                    className={`group relative rounded-2xl border p-5 space-y-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-accent/10 border-accent shadow-md shadow-accent/5"
                        : "bg-surface border-border hover:border-accent/50 hover:bg-surface-hover"
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono text-muted border-border">
                          {model.speedTier} Speed
                        </Badge>
                        {model.isPopular && <Badge className="bg-accent text-accent-foreground text-[9px]">Popular</Badge>}
                        {model.isNew && <Badge variant="secondary" className="text-[9px]">New</Badge>}
                        {model.requiredPlan !== "FREE" && (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[9px]">
                            {model.requiredPlan}+
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Compare Checkbox */}
                        <button
                          onClick={(e) => handleToggleCompare(e, model.id)}
                          className={`p-1.5 rounded-lg border text-xs font-mono transition-all ${
                            isComp
                              ? "bg-accent text-accent-foreground border-accent"
                              : "border-border text-muted hover:text-foreground"
                          }`}
                          title="Compare Model"
                        >
                          <Scale className="h-3.5 w-3.5" />
                        </button>

                        {/* Favorite Star */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, model.id)}
                          className="p-1.5 rounded-lg border border-border text-muted hover:text-amber-400 transition-colors"
                        >
                          <Star className={`h-3.5 w-3.5 ${isFav ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Model Info */}
                    <div>
                      <h3 className="font-bold text-foreground text-base group-hover:text-accent transition-colors flex items-center gap-2">
                        {model.name}
                        {isSelected && <Check className="h-4 w-4 text-accent" />}
                      </h3>
                      <p className="text-xs text-muted leading-relaxed line-clamp-2 mt-1 font-sans">
                        {model.description}
                      </p>
                    </div>

                    {/* Specs Pills */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-muted">
                      <span className="px-2 py-0.5 rounded-md bg-background border border-border">
                        {model.supportedResolutions.join(" / ")}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-background border border-border">
                        {model.supportedDurations.join(", ")}
                      </span>
                      {model.supportsAudio && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Audio Enabled
                        </span>
                      )}
                      {model.supportsMotionControl && (
                        <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/30">
                          Motion Control
                        </span>
                      )}
                    </div>

                    {/* Bottom Pricing Row */}
                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono">
                      <span className="text-muted">Starting price:</span>
                      <span className="font-bold text-accent">from {model.creditCost} CREDITS</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Model Comparison Dialog (PART 38) */}
      {showCompareModal && (
        <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
          <DialogContent className="max-w-3xl bg-surface border-border text-foreground font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Scale className="h-5 w-5 text-accent" /> Side-by-Side Model Comparison
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-4 pt-4 overflow-x-auto">
              {compareIds.map((id) => {
                const model = models.find((m) => m.id === id);
                if (!model) return null;

                return (
                  <div key={model.id} className="p-4 rounded-xl border border-border bg-background space-y-3 font-mono text-xs">
                    <div className="font-bold text-foreground text-sm">{model.name}</div>
                    <div className="text-[10px] text-muted">{model.description}</div>

                    <div className="space-y-2 pt-2 border-t border-border">
                      <div>
                        <span className="text-muted block text-[10px]">SPEED TIER:</span>
                        <span className="font-bold text-accent">{model.speedTier}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">MAX RESOLUTION:</span>
                        <span className="font-bold">{model.supportedResolutions.join(", ")}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">DURATIONS:</span>
                        <span className="font-bold">{model.supportedDurations.join(", ")}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">AUDIO SUPPORT:</span>
                        <span className="font-bold">{model.supportsAudio ? "Yes" : "No"}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">BASE CREDIT COST:</span>
                        <span className="font-bold text-accent">{model.creditCost} Credits</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">REQUIRED PLAN:</span>
                        <span className="font-bold text-purple-400">{model.requiredPlan}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        onSelectModel(model);
                        setShowCompareModal(false);
                        onOpenChange(false);
                      }}
                      className="w-full bg-accent text-accent-foreground font-bold text-xs mt-2"
                    >
                      Select Model
                    </Button>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
