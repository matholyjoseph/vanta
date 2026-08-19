"use client";

import * as React from "react";
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  Loader2,
  AlertCircle,
  XCircle,
  Copy,
  Maximize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export interface GenerationCardData {
  id: string;
  prompt: string;
  negativePrompt?: string | null;
  modelId: string;
  mode: string;
  status: string; // QUEUED | SUBMITTED | GENERATING | PROCESSING | COMPLETED | FAILED | CANCELLED
  progress: number;
  duration: string;
  resolution: string;
  aspectRatio: string;
  seed?: string | null;
  creditCost: number;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  errorMessage?: string | null;
  createdAt: string | Date;
  model?: { name: string } | null;
}

interface GenerationCardProps {
  generation: GenerationCardData;
  onRemix?: (gen: GenerationCardData) => void;
  onUseAsReference?: (gen: GenerationCardData) => void;
  onRetry?: (genId: string) => void;
  onCancel?: (genId: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function GenerationCard({
  generation,
  onRemix,
  onUseAsReference,
  onRetry,
  onCancel,
  isSelected,
  onSelect,
}: GenerationCardProps) {
  const { showToast } = useToast();

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [progressTime, setProgressTime] = React.useState(0);
  const [videoDuration, setVideoDuration] = React.useState(0);

  const isQueued = generation.status === "QUEUED" || generation.status === "SUBMITTED";
  const isGenerating = generation.status === "GENERATING" || generation.status === "PROCESSING";
  const isCompleted = generation.status === "COMPLETED" && !!generation.videoUrl;
  const isFailed = generation.status === "FAILED";
  const isCancelled = generation.status === "CANCELLED";

  const handleTogglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (err: unknown) {
        setIsPlaying(false);
        showToast("Video format or media source could not be played.", "error");
      }
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!generation.videoUrl) return;
    const a = document.createElement("a");
    a.href = generation.videoUrl;
    a.download = `vanta-generation-${generation.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Download started", "success");
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border p-4 transition-all space-y-3 cursor-pointer ${
        isSelected
          ? "border-accent bg-accent/5 shadow-[0_0_25px_rgba(200,255,0,0.12)]"
          : "border-border bg-surface hover:border-accent/30"
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-accent border-accent/30 text-[10px]">
            {generation.model?.name || generation.modelId}
          </Badge>
          <span className="text-muted text-[10px]">{generation.mode}</span>
          <span className="text-muted text-[10px]">•</span>
          <span className="text-muted text-[10px]">{generation.resolution}</span>
          <span className="text-muted text-[10px]">•</span>
          <span className="text-muted text-[10px]">{generation.duration}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-accent text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> {generation.creditCost} CR
          </span>
        </div>
      </div>

      {/* Media & Status Viewport */}
      <div className="relative aspect-video w-full rounded-xl bg-background border border-border overflow-hidden flex items-center justify-center">
        {/* 1. QUEUED STATE */}
        {isQueued && (
          <div className="text-center space-y-2 p-4">
            <Loader2 className="h-8 w-8 text-accent animate-spin mx-auto" />
            <div className="font-mono text-xs font-bold text-foreground">Queued in Render Node...</div>
            <p className="text-[11px] text-muted font-mono">Preparing model weights & canvas frame...</p>
            {onCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(generation.id);
                }}
                className="mt-2 text-[11px] font-mono border-border text-muted hover:text-destructive"
              >
                Cancel Request
              </Button>
            )}
          </div>
        )}

        {/* 2. GENERATING / PROCESSING STATE */}
        {isGenerating && (
          <div className="w-full px-8 py-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-accent">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{generation.status === "PROCESSING" ? "PROCESSING VIDEO..." : `GENERATING ${generation.progress}%`}</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${generation.progress}%` }}
              />
            </div>

            <p className="text-[10px] font-mono text-muted">
              Rendering frames with multi-model synthesis
            </p>
          </div>
        )}

        {/* 3. FAILED STATE */}
        {isFailed && (
          <div className="text-center space-y-3 p-6 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="font-mono text-xs font-bold text-destructive">Generation Failed</div>
            <p className="text-[11px] text-muted font-sans leading-snug">
              {generation.errorMessage || "An unexpected error occurred during rendering."}
            </p>
            {onRetry && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry(generation.id);
                }}
                className="bg-accent text-accent-foreground font-bold text-xs"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retry Generation
              </Button>
            )}
          </div>
        )}

        {/* 4. CANCELLED STATE */}
        {isCancelled && (
          <div className="text-center space-y-2 p-6">
            <XCircle className="h-8 w-8 text-muted mx-auto" />
            <div className="font-mono text-xs font-bold text-muted">Generation Cancelled</div>
            <p className="text-[11px] text-muted">Reserved credits have been refunded to your wallet.</p>
          </div>
        )}

        {/* 5. COMPLETED VIDEO PLAYER */}
        {isCompleted && (
          <div className="relative w-full h-full group/player">
            <video
              ref={videoRef}
              src={generation.videoUrl || ""}
              poster={generation.thumbnailUrl || undefined}
              loop
              muted={isMuted}
              onTimeUpdate={() => {
                if (videoRef.current) setProgressTime(videoRef.current.currentTime);
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) setVideoDuration(videoRef.current.duration);
              }}
              className="w-full h-full object-cover"
            />

            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/player:opacity-100 transition-opacity flex flex-col justify-between p-3">
              <div className="flex justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-1.5 rounded-full bg-black/60 text-foreground hover:text-accent"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center justify-center">
                <button
                  onClick={handleTogglePlay}
                  className="p-3 rounded-full bg-accent text-accent-foreground hover:scale-110 transition-transform shadow-xl"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
                </button>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={videoDuration || 100}
                  value={progressTime}
                  onChange={(e) => {
                    if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-1 accent-[#c8ff00] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Text */}
      <p className="text-xs text-foreground leading-relaxed line-clamp-2 font-sans">
        {generation.prompt}
      </p>

      {/* Action Buttons Row */}
      {isCompleted && (
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="h-8 text-xs font-mono border-border"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download
            </Button>

            {onRemix && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemix(generation);
                }}
                className="h-8 text-xs font-mono border-border"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Remix
              </Button>
            )}

            {onUseAsReference && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseAsReference(generation);
                }}
                className="h-8 text-xs font-mono border-border hidden sm:inline-flex"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Reference
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
