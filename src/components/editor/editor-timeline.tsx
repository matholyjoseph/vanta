"use client";

import * as React from "react";
import {
  Scissors,
  Magnet,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  MoveRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditorTimelineState, TimelineClip } from "@/lib/editor/editor-types";

interface EditorTimelineProps {
  timelineState: EditorTimelineState;
  currentTime: number;
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
  onSeek: (time: number) => void;
  onSplitAtPlayhead: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
}

export function EditorTimeline({
  timelineState,
  currentTime,
  selectedClipId,
  onSelectClip,
  onSeek,
  onSplitAtPlayhead,
  onDeleteClip,
}: EditorTimelineProps) {
  const [zoomLevel, setZoomLevel] = React.useState(20); // Pixels per second
  const [snapping, setSnapping] = React.useState(true);

  // Keyboard shortcut listener for 'S' key split
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "s" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        if (selectedClipId) {
          onSplitAtPlayhead(selectedClipId);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedClipId, onSplitAtPlayhead]);

  const rulerMarks = [];
  const duration = Math.max(timelineState.totalDuration || 30, 30);
  for (let i = 0; i <= duration; i += 5) {
    rulerMarks.push(i);
  }

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = clickX / zoomLevel;
    onSeek(Math.max(0, seekTime));
  };

  return (
    <div className="h-72 border-t border-border bg-[#09090b] flex flex-col font-sans select-none shrink-0 overflow-hidden">
      {/* Timeline Controls Header */}
      <div className="h-10 border-b border-border bg-surface/50 px-4 flex items-center justify-between font-mono text-xs text-muted">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => selectedClipId && onSplitAtPlayhead(selectedClipId)}
            disabled={!selectedClipId}
            title="Split Clip at Playhead (S Key)"
            className="h-7 text-xs font-mono border border-border"
          >
            <Scissors className="h-3.5 w-3.5 mr-1" /> Split (S)
          </Button>

          <button
            type="button"
            onClick={() => setSnapping(!snapping)}
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
              snapping ? "bg-accent/15 text-accent border-accent/40" : "border-border text-muted"
            }`}
          >
            <Magnet className="h-3.5 w-3.5" /> Snapping
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <ZoomOut className="h-3.5 w-3.5 text-muted cursor-pointer" onClick={() => setZoomLevel(Math.max(10, zoomLevel - 5))} />
          <input
            type="range"
            min="10"
            max="60"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseInt(e.target.value))}
            className="w-24 accent-accent"
          />
          <ZoomIn className="h-3.5 w-3.5 text-muted cursor-pointer" onClick={() => setZoomLevel(Math.min(60, zoomLevel + 5))} />
        </div>
      </div>

      {/* Main Timeline Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Track Headers (Width: 190px) */}
        <div className="w-48 border-r border-border bg-[#09090b] shrink-0 z-20 overflow-y-auto">
          <div className="h-7 border-b border-border bg-surface/40" /> {/* Ruler Spacer */}
          {(timelineState.tracks || []).map((track) => (
            <div key={track.id} className="h-16 border-b border-border/70 p-2 flex items-center justify-between text-xs font-mono">
              <div className="truncate max-w-[100px]">
                <div className="font-bold text-foreground truncate">{track.name}</div>
                <div className="text-[9px] text-muted">{track.type}</div>
              </div>

              <div className="flex items-center gap-1 text-muted">
                {track.muted ? <VolumeX className="h-3.5 w-3.5 text-destructive" /> : <Volume2 className="h-3.5 w-3.5" />}
                {track.hidden ? <EyeOff className="h-3.5 w-3.5 text-muted" /> : <Eye className="h-3.5 w-3.5" />}
              </div>
            </div>
          ))}
        </div>

        {/* Right Tracks & Ruler Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#09090b]" style={{ scrollbarWidth: "thin" }}>
          {/* Time Ruler */}
          <div
            onClick={handleRulerClick}
            className="h-7 border-b border-border bg-surface/60 relative cursor-pointer font-mono text-[9px] text-muted flex items-center"
            style={{ width: `${duration * zoomLevel}px` }}
          >
            {rulerMarks.map((sec) => (
              <div
                key={sec}
                className="absolute top-0 bottom-0 border-l border-border/80 pl-1 pt-1"
                style={{ left: `${sec * zoomLevel}px` }}
              >
                {sec}s
              </div>
            ))}
          </div>

          {/* Interactive Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-accent z-30 pointer-events-none"
            style={{ left: `${currentTime * zoomLevel}px` }}
          >
            <div className="w-3 h-3 bg-accent rounded-full -ml-1.25 -mt-1 shadow-lg" />
          </div>

          {/* Tracks Content */}
          <div style={{ width: `${duration * zoomLevel}px` }}>
            {(timelineState.tracks || []).map((track) => (
              <div key={track.id} className="h-16 border-b border-border/70 relative bg-surface/20">
                {/* Track Clips */}
                {track.clips.map((clip) => {
                  const isSelected = selectedClipId === clip.id;
                  const clipWidth = clip.timelineDuration * zoomLevel;
                  const clipLeft = clip.timelineStart * zoomLevel;

                  return (
                    <div
                      key={clip.id}
                      onClick={() => onSelectClip(clip.id)}
                      style={{
                        left: `${clipLeft}px`,
                        width: `${clipWidth}px`,
                      }}
                      className={`absolute top-2 bottom-2 rounded-xl border p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-all ${
                        isSelected
                          ? "border-accent bg-accent/25 shadow-[0_0_15px_rgba(200,255,0,0.2)] z-10"
                          : "border-border bg-surface/80 hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-foreground font-bold truncate">
                        <span className="truncate">{clip.name}</span>
                        <span className="text-[9px] text-accent">{clip.timelineDuration.toFixed(1)}s</span>
                      </div>

                      {/* Trim Edge Handles */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent/40 hover:bg-accent cursor-col-resize" />
                      <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-accent/40 hover:bg-accent cursor-col-resize" />
                    </div>
                  );
                })}

                {/* Text Layers */}
                {track.textLayers.map((tl) => {
                  const clipWidth = tl.timelineDuration * zoomLevel;
                  const clipLeft = tl.timelineStart * zoomLevel;
                  return (
                    <div
                      key={tl.id}
                      style={{ left: `${clipLeft}px`, width: `${clipWidth}px` }}
                      className="absolute top-2 bottom-2 rounded-xl border border-accent/40 bg-accent/15 p-2 font-mono text-[10px] text-accent font-bold truncate"
                    >
                      {tl.text}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
