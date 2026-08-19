"use client";

import * as React from "react";
import {
  Move3D,
  SlidersHorizontal,
  ImagePlus,
  Compass,
  Sparkles,
  Volume2,
  Film,
  ChevronDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModelSelectorModal } from "@/components/studio/model-selector-modal";
import { useToast } from "@/components/ui/toast";

export interface AIModelData {
  id: string;
  slug: string;
  type?: string;
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
  speedTier: string;
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
}

interface CreationSettingsProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  mode: string;
  onModeChange: (mode: string) => void;
  duration: string;
  onDurationChange: (duration: string) => void;
  resolution: string;
  onResolutionChange: (resolution: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  audio: boolean;
  onAudioChange: (audio: boolean) => void;
  cameraMotion: {
    pan: string;
    zoom: string;
    orbit: string;
  };
  onCameraMotionChange: (motion: { pan: string; zoom: string; orbit: string }) => void;
  onReferenceUpload?: (file: File) => void;
  models?: AIModelData[];
  creditCost?: number;
}

export function CreationSettings({
  selectedModelId,
  onModelChange,
  mode,
  onModeChange,
  duration,
  onDurationChange,
  resolution,
  onResolutionChange,
  aspectRatio,
  onAspectRatioChange,
  audio,
  onAudioChange,
  cameraMotion,
  onCameraMotionChange,
  models = [],
  creditCost = 8,
}: CreationSettingsProps) {
  const { showToast } = useToast();
  const refInputRef = React.useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = React.useState(false);

  const selectedModel =
    models.find((m) => m.id === selectedModelId || m.slug === selectedModelId) || models[0];

  const supportedModes = selectedModel?.supportedModes || ["text-to-video"];
  const supportedDurations = selectedModel?.supportedDurations || ["5s"];
  const supportedResolutions = selectedModel?.supportedResolutions || ["1080p"];
  const supportedAspectRatios = selectedModel?.supportedAspectRatios || ["16:9"];

  // AUTO-ADJUST NEAREST VALID SETTINGS ON MODEL CHANGE (PART 35)
  React.useEffect(() => {
    if (!selectedModel) return;

    let adjusted = false;

    if (supportedModes.length > 0 && !supportedModes.includes(mode)) {
      onModeChange(supportedModes[0]);
      adjusted = true;
    }

    if (supportedDurations.length > 0 && !supportedDurations.includes(duration)) {
      onDurationChange(supportedDurations[0]);
      adjusted = true;
    }

    if (supportedResolutions.length > 0 && !supportedResolutions.includes(resolution)) {
      onResolutionChange(supportedResolutions[0]);
      adjusted = true;
    }

    if (supportedAspectRatios.length > 0 && !supportedAspectRatios.includes(aspectRatio)) {
      onAspectRatioChange(supportedAspectRatios[0]);
      adjusted = true;
    }

    if (adjusted) {
      showToast(`Adjusted parameters to match supported bounds of '${selectedModel.name}'.`, "info");
    }
  }, [selectedModelId, selectedModel]);

  return (
    <aside className="w-80 border-r border-border bg-[#09090b] flex flex-col h-full overflow-y-auto shrink-0 font-sans">
      {/* Panel Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-sm text-foreground tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-accent" /> Creation Settings
        </h2>
        <div className="flex items-center gap-1 font-mono text-[10px] text-accent font-bold px-2 py-1 bg-accent/10 border border-accent/30 rounded-lg">
          <Sparkles className="h-3 w-3" /> {creditCost} CREDITS
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Model Selector Card & Modal Launcher */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              AI Model Engine
            </label>
            {selectedModel && (
              <Badge variant="outline" className="text-[9px] font-mono text-accent border-accent/30">
                {selectedModel.speedTier}
              </Badge>
            )}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full text-left p-3 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent/40 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div>
              <div className="font-bold text-xs text-foreground group-hover:text-accent font-mono transition-colors">
                {selectedModel?.name || "Select AI Model"}
              </div>
              <div className="text-[10px] font-mono text-muted mt-0.5">
                Starting from {selectedModel?.creditCost || 8} credits
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted group-hover:text-foreground shrink-0" />
          </button>
        </div>

        {/* Dynamic Mode Selector Tabs */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            Generation Mode
          </label>
          <div className="grid grid-cols-3 gap-1 bg-surface p-1 rounded-xl border border-border">
            {[
              { id: "text-to-video", label: "Text" },
              { id: "image-to-video", label: "Image" },
              { id: "motion-control", label: "Motion" },
            ].map((tab) => {
              const isSupported = supportedModes.includes(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => isSupported && onModeChange(tab.id)}
                  disabled={!isSupported}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    mode === tab.id
                      ? "bg-surface-hover text-accent border border-accent/30 shadow-sm"
                      : isSupported
                      ? "text-muted hover:text-foreground"
                      : "text-muted-foreground/30 cursor-not-allowed opacity-40"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Duration & Resolution */}
        <div className="grid grid-cols-2 gap-3">
          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => onDurationChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
            >
              {supportedDurations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Resolution */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              Resolution
            </label>
            <select
              value={resolution}
              onChange={(e) => onResolutionChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
            >
              {supportedResolutions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Aspect Ratio */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {supportedAspectRatios.map((ratio) => (
              <button
                key={ratio}
                onClick={() => onAspectRatioChange(ratio)}
                className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                  aspectRatio === ratio
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-muted hover:border-accent/40"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Toggle */}
        {selectedModel?.supportsAudio && (
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-accent" />
              <span className="text-xs font-mono font-semibold text-foreground">AI Audio / Sound FX</span>
            </div>
            <input
              type="checkbox"
              checked={audio}
              onChange={(e) => onAudioChange(e.target.checked)}
              className="h-4 w-4 accent-[#c8ff00] cursor-pointer"
            />
          </div>
        )}

        {/* Reference Dropzone */}
        {selectedModel?.supportsImageReference && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              <span>Image Reference</span>
              <button
                onClick={() => refInputRef.current?.click()}
                className="text-accent hover:underline focus:outline-none"
              >
                BROWSE
              </button>
            </div>
            <input ref={refInputRef} type="file" accept="image/*" className="hidden" />
            <div
              onClick={() => refInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 rounded-xl p-4 text-center bg-surface/40 hover:bg-surface hover:border-accent/40 transition-colors cursor-pointer space-y-2"
            >
              <div className="mx-auto w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center text-muted">
                <ImagePlus className="h-3.5 w-3.5" />
              </div>
              <div className="text-xs text-muted font-mono">
                Drop image or select
              </div>
            </div>
          </div>
        )}

        {/* Camera Motion Controls */}
        {selectedModel?.supportsMotionControl && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              <Move3D className="h-3.5 w-3.5 text-accent" />
              <span>Camera Motion</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[10px] text-muted uppercase">Pan</label>
                <select
                  value={cameraMotion.pan}
                  onChange={(e) =>
                    onCameraMotionChange({ ...cameraMotion, pan: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-foreground focus:outline-none"
                >
                  <option value="static">Static</option>
                  <option value="left">Pan Left</option>
                  <option value="right">Pan Right</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted uppercase">Zoom</label>
                <select
                  value={cameraMotion.zoom}
                  onChange={(e) =>
                    onCameraMotionChange({ ...cameraMotion, zoom: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-foreground focus:outline-none"
                >
                  <option value="static">Static</option>
                  <option value="in">Zoom In</option>
                  <option value="out">Zoom Out</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Model Browser Modal */}
      <ModelSelectorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        models={models as any}
        selectedModelId={selectedModelId}
        onSelectModel={(m) => onModelChange(m.slug || m.id)}
      />
    </aside>
  );
}
