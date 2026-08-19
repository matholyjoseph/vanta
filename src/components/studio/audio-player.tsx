"use client";

import * as React from "react";
import { Play, Pause, Volume2, VolumeX, Download, Film, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  src: string;
  title?: string;
  durationText?: string;
  onAddToVideo?: () => void;
}

export function AudioPlayer({ src, title = "AI Audio Track", durationText, onAddToVideo }: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 font-sans">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      {/* Title & Time Display */}
      <div className="flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-foreground font-bold truncate">
          <Sparkles className="h-4 w-4 text-accent shrink-0" />
          <span className="truncate">{title}</span>
        </div>
        <div className="text-muted text-[11px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Waveform Visualization Bars */}
      <div className="h-10 w-full bg-background rounded-xl border border-border p-2 flex items-center gap-1 overflow-hidden">
        {Array.from({ length: 48 }).map((_, i) => {
          const height = Math.min(100, Math.max(15, (Math.sin(i * 0.4) + 1) * 40 + (i % 3) * 10));
          const progress = duration > 0 ? (currentTime / duration) * 48 : 0;
          const isPassed = i <= progress;
          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all ${
                isPassed ? "bg-accent" : "bg-surface-hover"
              }`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      {/* Control Toolbar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={togglePlay}
            className="h-9 w-9 rounded-full bg-accent text-accent-foreground hover:bg-accent-hover p-0 cursor-pointer"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>

          {/* Volume Button */}
          <button onClick={toggleMute} className="text-muted hover:text-foreground">
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Seek Input */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 accent-[#c8ff00] cursor-pointer h-1.5 bg-background rounded-lg"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onAddToVideo && (
            <Button
              size="sm"
              onClick={onAddToVideo}
              className="bg-accent text-accent-foreground font-bold text-xs h-8 px-3 cursor-pointer"
            >
              <Film className="h-3.5 w-3.5 mr-1" /> Add to Video
            </Button>
          )}

          <a href={src} target="_blank" rel="noreferrer" download="vanta-audio.mp3">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-border">
              <Download className="h-3.5 w-3.5 text-muted hover:text-foreground" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
