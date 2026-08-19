"use client";

import * as React from "react";
import { Play, Download, RefreshCw, Sparkles, X, Heart, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardGeneration } from "@/components/dashboard/dashboard-content";

interface StudioInspectorProps {
  generation: DashboardGeneration | null;
  onClose?: () => void;
  onRemix?: (prompt: string) => void;
}

export function StudioInspector({
  generation,
  onClose,
  onRemix,
}: StudioInspectorProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isFavorited, setIsFavorited] = React.useState(generation?.isFavorite || false);

  if (!generation) {
    return (
      <aside className="w-80 border-l border-border bg-[#09090b] flex flex-col items-center justify-center p-6 text-center text-muted hidden xl:flex">
        <div className="mx-auto w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-3">
          <Play className="h-5 w-5 opacity-40" />
        </div>
        <p className="text-sm font-semibold text-foreground">No Generation Selected</p>
        <p className="text-xs text-muted mt-1 max-w-xs">
          Select a generated clip from the feed to inspect its parameters, remix, or download.
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-96 border-l border-border bg-[#09090b] flex flex-col h-full overflow-y-auto shrink-0 hidden xl:flex">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-sm text-foreground tracking-tight">
          Inspector
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className={`p-1.5 rounded-lg hover:bg-surface transition-colors ${
              isFavorited ? "text-red-500" : "text-muted hover:text-foreground"
            }`}
            title="Favorite generation"
          >
            <Heart className="h-4 w-4 fill-current" />
          </button>
          <button
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
            title="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
              title="Close inspector"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Video Player Preview Container (Screenshot 4) */}
        <div className="relative aspect-video w-full rounded-xl bg-background border border-border overflow-hidden flex items-center justify-center group shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-surface to-background" />

          {/* Interactive Play Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="relative z-10 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer"
          >
            <Play className="h-5 w-5 fill-white ml-0.5" />
          </button>
        </div>

        {/* Action Buttons Row (Remix, Upscale, Download) */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onRemix && onRemix(generation.prompt)}
            className="text-xs font-semibold"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Remix
          </Button>

          {/* Disabled AI Upscale with Tooltip */}
          <Button
            size="sm"
            variant="outline"
            disabled
            title="4K AI Upscaling is an upcoming enterprise feature"
            className="text-xs font-semibold opacity-50 cursor-not-allowed"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Upscale
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs font-semibold"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download
          </Button>
        </div>

        {/* Prompt Box */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            Prompt
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5 text-xs text-foreground/90 leading-relaxed font-sans">
            {generation.prompt}
          </div>
        </div>

        {/* Metadata Grid (Screenshot 4) */}
        <div className="space-y-2 pt-2">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            Parameters
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
              <div className="text-[10px] text-muted uppercase">MODEL</div>
              <div className="font-bold text-foreground truncate">
                {typeof generation.model === "object" ? generation.model?.name : generation.model || "Vanta Engine"}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
              <div className="text-[10px] text-muted uppercase">SEED</div>
              <div className="font-bold text-foreground truncate">
                {generation.seed || "893410928"}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
              <div className="text-[10px] text-muted uppercase">RESOLUTION</div>
              <div className="font-bold text-foreground">
                {generation.resolution}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
              <div className="text-[10px] text-muted uppercase">DURATION</div>
              <div className="font-bold text-foreground">
                {generation.duration}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
              <div className="text-[10px] text-muted uppercase">FPS</div>
              <div className="font-bold text-foreground">{generation.fps}</div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
              <div className="text-[10px] text-muted uppercase">CREATED</div>
              <div className="font-bold text-foreground">
                {new Date(generation.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Add to Project CTA */}
        <Button
          variant="outline"
          className="w-full text-xs font-semibold justify-center border-border hover:bg-surface"
        >
          <Plus className="mr-2 h-4 w-4 text-accent" /> Add to Timeline Project
        </Button>
      </div>
    </aside>
  );
}
