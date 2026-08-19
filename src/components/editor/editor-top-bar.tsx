"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clapperboard,
  Undo2,
  Redo2,
  Save,
  Download,
  SlidersHorizontal,
  Monitor,
  Smartphone,
  Square,
  Layers,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EditorTopBarProps {
  projectName: string;
  aspectRatio: string;
  saveStatus: "saved" | "saving" | "unsaved";
  previewQuality: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAspectRatioChange: (aspect: string) => void;
  onPreviewQualityChange: (quality: string) => void;
  onExport: () => void;
}

export function EditorTopBar({
  projectName,
  aspectRatio,
  saveStatus,
  previewQuality,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAspectRatioChange,
  onPreviewQualityChange,
  onExport,
}: EditorTopBarProps) {
  return (
    <header className="h-16 border-b border-border bg-[#09090b] px-4 md:px-6 flex items-center justify-between gap-4 shrink-0 font-sans select-none z-30">
      {/* Left: Brand & Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/editor" className="text-muted hover:text-foreground transition-colors p-2 rounded-xl hover:bg-surface">
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-surface border border-border">
            <Clapperboard className="h-4 w-4 text-accent rotate-12" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-foreground tracking-tight flex items-center gap-2">
              {projectName}
            </h1>
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
              {saveStatus === "saving" ? (
                <span className="text-yellow-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 animate-spin" /> Saving...
                </span>
              ) : saveStatus === "saved" ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Saved
                </span>
              ) : (
                <span className="text-muted">Unsaved changes</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Center: Undo/Redo & Aspect Ratio */}
      <div className="hidden md:flex items-center gap-4 bg-surface/60 p-1.5 rounded-2xl border border-border font-mono text-xs">
        {/* Undo / Redo */}
        <div className="flex items-center gap-1 border-r border-border pr-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-2 rounded-xl transition-colors ${
              canUndo ? "text-foreground hover:bg-background cursor-pointer" : "text-muted/40 cursor-not-allowed"
            }`}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`p-2 rounded-xl transition-colors ${
              canRedo ? "text-foreground hover:bg-background cursor-pointer" : "text-muted/40 cursor-not-allowed"
            }`}
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted uppercase font-mono px-1">Canvas:</span>
          <select
            value={aspectRatio}
            onChange={(e) => onAspectRatioChange(e.target.value)}
            className="bg-background border border-border rounded-xl px-2.5 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-accent"
          >
            <option value="16:9">16:9 Widescreen</option>
            <option value="9:16">9:16 Vertical Reel</option>
            <option value="1:1">1:1 Square</option>
            <option value="4:5">4:5 Social Feed</option>
          </select>
        </div>

        {/* Preview Quality Selector */}
        <div className="flex items-center gap-1 border-l border-border pl-2">
          <span className="text-[10px] text-muted uppercase font-mono px-1">Quality:</span>
          <select
            value={previewQuality}
            onChange={(e) => onPreviewQualityChange(e.target.value)}
            className="bg-background border border-border rounded-xl px-2.5 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-accent"
          >
            <option value="Auto">Auto</option>
            <option value="360p">360p Fast</option>
            <option value="720p">720p HD</option>
            <option value="Full">Full 1080p</option>
          </select>
        </div>
      </div>

      {/* Right: Export Button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={onExport}
          className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5 rounded-xl shadow-lg hover:shadow-accent/20 hover:scale-105 transition-all cursor-pointer"
        >
          <Download className="h-4 w-4 mr-2" /> Export Video
        </Button>
      </div>
    </header>
  );
}
