"use client";

import * as React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Maximize2,
  Grid,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorTimelineState } from "@/lib/editor/editor-types";

interface EditorCanvasPreviewProps {
  timelineState: EditorTimelineState;
  currentTime: number;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
  onSeek: (time: number) => void;
}

export function EditorCanvasPreview({
  timelineState,
  currentTime,
  isPlaying,
  onPlayPauseToggle,
  onSeek,
}: EditorCanvasPreviewProps) {
  const [showGuides, setShowGuides] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);

  // Determine active visual clip based on currentTime
  let activeVideoClipUrl: string | null = null;
  let activeTextLayers: any[] = [];

  for (const track of timelineState.tracks || []) {
    if (track.hidden || track.muted) continue;

    if (track.type === "VIDEO" || track.type === "IMAGE" || track.type === "OVERLAY") {
      for (const clip of track.clips) {
        if (currentTime >= clip.timelineStart && currentTime <= clip.timelineStart + clip.timelineDuration) {
          activeVideoClipUrl = clip.sourceUrl;
          break;
        }
      }
    }

    if (track.type === "TEXT") {
      for (const tl of track.textLayers) {
        if (currentTime >= tl.timelineStart && currentTime <= tl.timelineStart + tl.timelineDuration) {
          activeTextLayers.push(tl);
        }
      }
    }
  }

  // Active Captions Segment
  const activeCaption = (timelineState.captionSegments || []).find(
    (cap) => currentTime >= cap.startTime && currentTime <= cap.endTime
  );

  const isVertical = timelineState.aspectRatio === "9:16";
  const isSquare = timelineState.aspectRatio === "1:1";

  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="flex-1 bg-black p-4 flex flex-col justify-between items-center relative overflow-hidden font-sans select-none">
      {/* Canvas Viewport Frame */}
      <div className="flex-1 w-full flex items-center justify-center relative">
        <div
          className={`relative border border-border/80 rounded-2xl overflow-hidden bg-[#09090b] shadow-2xl flex items-center justify-center transition-all ${
            isVertical
              ? "h-full max-h-[520px] aspect-[9/16]"
              : isSquare
              ? "h-full max-h-[480px] aspect-square"
              : "w-full max-w-[850px] aspect-video"
          }`}
        >
          {/* Active Video Stream */}
          {activeVideoClipUrl ? (
            <video
              ref={videoRef}
              src={activeVideoClipUrl}
              muted={isMuted}
              className="w-full h-full object-cover"
              loop
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-muted font-mono text-xs">
              <span className="text-accent font-bold mb-1">Canvas Active</span>
              <span>No media clip at current playhead position ({currentTime.toFixed(2)}s)</span>
            </div>
          )}

          {/* Guide Overlay Toggle */}
          {showGuides && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-accent/20">
              <div className="border-r border-b border-accent/20" />
              <div className="border-r border-b border-accent/20" />
              <div className="border-b border-accent/20" />
              <div className="border-r border-b border-accent/20" />
              <div className="border-r border-b border-accent/20" />
              <div className="border-b border-accent/20" />
              <div className="border-r border-accent/20" />
              <div className="border-r border-accent/20" />
              <div />
            </div>
          )}

          {/* Render Text Layers */}
          {activeTextLayers.map((tl) => (
            <div
              key={tl.id}
              style={{
                fontFamily: tl.fontFamily,
                fontSize: `${tl.fontSize}px`,
                fontWeight: tl.fontWeight,
                color: tl.color,
                textAlign: tl.alignment as any,
              }}
              className="absolute drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] px-4 py-2 font-sans font-bold"
            >
              {tl.text}
            </div>
          ))}

          {/* Render Active Captions */}
          {activeCaption && (
            <div className="absolute bottom-8 px-6 py-2 bg-black/80 rounded-xl border border-accent/40 text-accent font-extrabold text-sm md:text-base font-mono shadow-2xl text-center max-w-[85%]">
              {activeCaption.text}
            </div>
          )}
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="w-full max-w-xl bg-surface/80 border border-border p-2 rounded-2xl flex items-center justify-between gap-4 font-mono text-xs backdrop-blur shrink-0 mt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSeek(Math.max(0, currentTime - 1))}
            className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onPlayPauseToggle}
            className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center font-bold shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => onSeek(currentTime + 1)}
            className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <span className="text-accent font-bold ml-2">
            {currentTime.toFixed(2)}s / {timelineState.totalDuration}s
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuides(!showGuides)}
            title="Toggle Rule of Thirds Guides"
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showGuides ? "text-accent bg-accent/15" : "text-muted hover:text-foreground"
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
