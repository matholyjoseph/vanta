"use client";

import * as React from "react";
import {
  SlidersHorizontal,
  Crop,
  Volume2,
  Zap,
  Sparkles as KeyframeIcon,
  Trash2,
  Layers,
  RotateCcw,
  Sparkles,
  Eye,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimelineClip, KeyframeProperty } from "@/lib/editor/editor-types";

interface EditorInspectorPanelProps {
  selectedClip: TimelineClip | null;
  currentTime: number;
  onUpdateClipTransform: (clipId: string, transform: any) => void;
  onUpdateClipSpeed: (clipId: string, speed: number) => void;
  onUpdateClipVolume: (clipId: string, volume: number) => void;
  onAddKeyframe: (clipId: string, property: KeyframeProperty, value: number) => void;
  onDeleteClip: (clipId: string) => void;
}

export function EditorInspectorPanel({
  selectedClip,
  currentTime,
  onUpdateClipTransform,
  onUpdateClipSpeed,
  onUpdateClipVolume,
  onAddKeyframe,
  onDeleteClip,
}: EditorInspectorPanelProps) {
  if (!selectedClip) {
    return (
      <div className="w-72 border-l border-border bg-[#09090b] p-6 flex flex-col items-center justify-center text-center text-muted font-mono text-xs shrink-0 select-none">
        <SlidersHorizontal className="h-8 w-8 text-muted/40 mb-2" />
        <span className="font-bold text-foreground">Inspector Panel</span>
        <span className="text-[11px] text-muted mt-1 leading-relaxed">
          Select a video clip, text layer, or audio track on the timeline to edit properties.
        </span>
      </div>
    );
  }

  const transforms = selectedClip.transforms || {
    positionX: 0,
    positionY: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
  };

  return (
    <div className="w-72 border-l border-border bg-[#09090b] flex flex-col h-full shrink-0 font-sans select-none overflow-hidden text-xs">
      {/* Inspector Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-surface/40">
        <div>
          <h3 className="font-bold text-foreground text-xs flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-accent" /> {selectedClip.name}
          </h3>
          <span className="text-[10px] text-muted font-mono">
            {selectedClip.timelineDuration.toFixed(2)}s · {selectedClip.mimeType}
          </span>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDeleteClip(selectedClip.id)}
          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Inspector Controls Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        {/* Transform Group */}
        <div className="space-y-3 font-mono">
          <h4 className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center justify-between">
            <span>Transform</span>
            <Badge variant="outline" className="text-[9px] text-muted border-border">2D Vector</Badge>
          </h4>

          {/* Scale */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-muted">
              <span>Scale</span>
              <button
                type="button"
                onClick={() => onAddKeyframe(selectedClip.id, "scale", transforms.scale)}
                title="Add Scale Keyframe"
                className="text-accent hover:scale-110 transition-transform cursor-pointer"
              >
                <KeyframeIcon className="h-3 w-3" />
              </button>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={transforms.scale}
              onChange={(e) =>
                onUpdateClipTransform(selectedClip.id, { ...transforms, scale: parseFloat(e.target.value) })
              }
              className="w-full accent-accent"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-muted">
              <span>Opacity ({Math.round(transforms.opacity * 100)}%)</span>
              <button
                type="button"
                onClick={() => onAddKeyframe(selectedClip.id, "opacity", transforms.opacity)}
                title="Add Opacity Keyframe"
                className="text-accent hover:scale-110 transition-transform cursor-pointer"
              >
                <KeyframeIcon className="h-3 w-3" />
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={transforms.opacity}
              onChange={(e) =>
                onUpdateClipTransform(selectedClip.id, { ...transforms, opacity: parseFloat(e.target.value) })
              }
              className="w-full accent-accent"
            />
          </div>
        </div>

        {/* Speed Control */}
        <div className="space-y-3 font-mono border-t border-border pt-4">
          <h4 className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Clip Speed
          </h4>

          <div className="grid grid-cols-4 gap-1.5">
            {[0.5, 0.75, 1.0, 1.5, 2.0, 4.0].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onUpdateClipSpeed(selectedClip.id, spd)}
                className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                  selectedClip.speed === spd
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-surface border-border text-muted hover:text-foreground"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Audio Volume & Ducking */}
        <div className="space-y-3 font-mono border-t border-border pt-4">
          <h4 className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Volume2 className="h-3.5 w-3.5" /> Volume</span>
            <button
              type="button"
              onClick={() => onAddKeyframe(selectedClip.id, "volume", selectedClip.volume)}
              className="text-accent hover:scale-110 transition-transform cursor-pointer"
            >
              <KeyframeIcon className="h-3 w-3" />
            </button>
          </h4>

          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={selectedClip.volume}
              onChange={(e) => onUpdateClipVolume(selectedClip.id, parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
            <span className="text-[10px] text-muted text-right block">
              {Math.round(selectedClip.volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
