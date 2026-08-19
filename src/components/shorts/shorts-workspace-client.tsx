"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Sparkles,
  Play,
  Pause,
  Scissors,
  Download,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Clapperboard,
  Sliders,
  Type,
  Subtitles,
  Share2,
  Zap,
  Edit3,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createShortClipAction,
  rewriteShortHookAction,
  batchExportShortsAction,
  openShortInAdvancedEditorAction,
} from "@/app/actions/shorts-actions";
import { useToast } from "@/components/ui/toast";

export function ShortsWorkspaceClient({ initialProject }: { initialProject: any }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [project, setProject] = React.useState(initialProject);
  const [activeTab, setActiveTab] = React.useState<"transcript" | "highlights" | "clips">("highlights");
  const [selectedClipIndex, setSelectedClipIndex] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isExporting, setIsExporting] = React.useState(false);
  const [selectedHookStyle, setSelectedHookStyle] = React.useState<any>("CURIOSITY");
  const [captionPreset, setCaptionPreset] = React.useState("BOLD_SOCIAL");
  const [reframeMode, setReframeMode] = React.useState("AUTO_REFRAME");

  const clips = project.clips || [];
  const activeClip = clips[selectedClipIndex] || clips[0] || null;

  const handleCreateClipFromCandidate = async (candidateId: string) => {
    try {
      const clip = await createShortClipAction(project.id, candidateId);
      showToast(`Short clip "${clip.name}" created!`, "success");
      const res = await fetch(`/api/shorts/${project.id}`);
    } catch (err: any) {
      showToast(err?.message || "Failed to create clip", "error");
    }
  };

  const handleRewriteHook = async () => {
    if (!activeClip) return;
    try {
      const updated = await rewriteShortHookAction(activeClip.id, selectedHookStyle);
      showToast(`Hook rewritten: "${updated.hookText}"`, "success");
      setProject((prev: any) => ({
        ...prev,
        clips: prev.clips.map((c: any) => (c.id === activeClip.id ? updated : c)),
      }));
    } catch (err: any) {
      showToast(err?.message || "Failed to rewrite hook", "error");
    }
  };

  const handleBatchExport = async () => {
    if (clips.length === 0) {
      showToast("No short clips created yet", "error");
      return;
    }

    setIsExporting(true);
    try {
      const clipIds = clips.map((c: any) => c.id);
      const assets = await batchExportShortsAction(project.id, clipIds, ["TIKTOK", "REELS", "SHORTS"]);
      showToast(`Batch exported ${assets.length} video assets to VANTA Asset Library!`, "success");
    } catch (err: any) {
      showToast(err?.message || "Batch export failed", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenInAdvancedEditor = async () => {
    if (!activeClip) return;
    try {
      const res = await openShortInAdvancedEditorAction(activeClip.id);
      showToast("Opening short in Advanced Video Editor...", "success");
      router.push(res.editorUrl);
    } catch (err: any) {
      showToast(err?.message || "Failed to open in editor", "error");
    }
  };

  const samplePreviewUrl = project.sourceAsset?.url || "/werewolf_cinematic_preview.jpg";

  return (
    <div className="h-screen w-full bg-[#09090b] text-foreground flex flex-col overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between gap-4 shrink-0 font-sans z-30">
        <div className="flex items-center gap-4">
          <Link href="/shorts" className="text-muted hover:text-foreground font-mono text-xs flex items-center gap-1">
            ← Shorts Home
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-accent" /> {project.name}
            </h1>
            <p className="text-[11px] font-mono text-muted">Status: {project.status}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <Badge variant="outline" className="text-xs font-bold border-accent/40 text-accent bg-accent/10">
            9:16 Vertical Format
          </Badge>

          {activeClip && (
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenInAdvancedEditor}
              className="border-border text-xs font-mono"
            >
              <Clapperboard className="h-3.5 w-3.5 mr-1.5" /> Edit in Advanced Editor
            </Button>
          )}

          <Button
            type="button"
            onClick={handleBatchExport}
            disabled={isExporting}
            className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5 rounded-xl shadow-lg cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" /> Batch Export Shorts
          </Button>
        </div>
      </header>

      {/* Main 3-Column Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Column: Transcript & AI Highlight Candidates (4 cols) */}
        <div className="md:col-span-4 border-r border-border bg-surface/30 p-4 flex flex-col min-h-0 overflow-hidden space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === "highlights" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("highlights")}
                className="text-xs font-bold font-mono"
              >
                AI Highlights ({project.highlights?.length || 0})
              </Button>
              <Button
                variant={activeTab === "transcript" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("transcript")}
                className="text-xs font-bold font-mono"
              >
                Full Transcript
              </Button>
            </div>
          </div>

          {activeTab === "highlights" ? (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {(project.highlights || []).map((cand: any) => (
                <div
                  key={cand.id}
                  className="p-4 rounded-2xl border border-border bg-background space-y-3 font-mono text-xs hover:border-accent/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <Badge className="bg-accent text-accent-foreground font-extrabold text-[10px]">
                      Score {cand.score} / 100
                    </Badge>
                    <span className="text-[10px] text-muted">
                      {cand.startTime.toFixed(1)}s - {cand.endTime.toFixed(1)}s
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-foreground">{cand.title}</h4>
                  <p className="text-[11px] text-muted leading-relaxed line-clamp-2">{cand.summary}</p>

                  <div className="p-2.5 rounded-xl border border-border/70 bg-surface/50 text-[11px]">
                    <span className="text-accent font-bold block text-[9px] uppercase">Suggested Hook</span>
                    <span className="text-foreground italic">"{cand.suggestedHook}"</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleCreateClipFromCandidate(cand.id)}
                    className="w-full bg-accent text-accent-foreground font-bold text-xs h-9 rounded-xl cursor-pointer"
                  >
                    <Scissors className="h-3.5 w-3.5 mr-1.5" /> Create 9:16 Short Clip
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            /* Transcript Editor View */
            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1">
              {(project.transcript || []).map((seg: any) => (
                <div key={seg.id} className="p-3 rounded-xl border border-border bg-background space-y-1">
                  <div className="flex justify-between text-[10px] text-muted">
                    <span className="text-accent font-bold">{seg.speaker}</span>
                    <span>{seg.startTime.toFixed(1)}s - {seg.endTime.toFixed(1)}s</span>
                  </div>
                  <p className="text-foreground text-[11px] leading-relaxed">{seg.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center Column: 9:16 Vertical Short Preview & Hook Rewriter (5 cols) */}
        <div className="md:col-span-5 border-r border-border p-6 flex flex-col items-center justify-between bg-black overflow-hidden relative space-y-4">
          {/* 9:16 Vertical Canvas Container */}
          <div className="relative h-full max-h-[520px] aspect-[9/16] rounded-2xl border border-border/80 overflow-hidden bg-[#09090b] shadow-2xl flex items-center justify-center group">
            <img
              src={samplePreviewUrl}
              alt="Short Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-12 w-12 text-accent" />
            </div>

            {/* Hook Overlay Box */}
            {activeClip?.hookText && (
              <div className="absolute top-10 inset-x-4 p-3 bg-black/80 rounded-xl border border-accent/40 text-accent font-extrabold text-xs font-mono shadow-2xl text-center">
                {activeClip.hookText}
              </div>
            )}

            {/* Caption Overlay Box */}
            <div className="absolute bottom-10 inset-x-6 p-3 bg-black/90 rounded-xl border border-accent text-white font-extrabold text-xs font-mono text-center shadow-2xl">
              "You've been doing this wrong the whole time."
            </div>
          </div>

          {/* Hook Rewriter Bar */}
          {activeClip && (
            <div className="w-full bg-surface/80 border border-border p-3 rounded-2xl space-y-2 font-mono text-xs shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-accent font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI Hook Rewriter
                </span>
                <select
                  value={selectedHookStyle}
                  onChange={(e) => setSelectedHookStyle(e.target.value as any)}
                  className="bg-background border border-border rounded-xl px-2 py-1 text-[11px] font-mono text-foreground"
                >
                  <option value="CURIOSITY">Curiosity Hook</option>
                  <option value="BOLD_STATEMENT">Bold Statement</option>
                  <option value="QUESTION">Question Hook</option>
                  <option value="DIRECT_BENEFIT">Direct Benefit</option>
                  <option value="STORY_SETUP">Story Setup</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeClip.hookText || ""}
                  className="flex-1 rounded-xl border border-border bg-background p-2 text-xs font-mono text-foreground"
                />
                <Button size="sm" onClick={handleRewriteHook} className="bg-accent text-accent-foreground font-bold">
                  Rewrite Hook
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Short Clip Controls & Presets (3 cols) */}
        <div className="md:col-span-3 bg-surface/30 p-4 flex flex-col min-h-0 overflow-hidden space-y-4 font-mono text-xs">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
            <Sliders className="h-4 w-4 text-accent" /> Short Clip Settings
          </h3>

          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Reframe Mode */}
            <div className="space-y-1">
              <label className="text-muted block text-[10px] uppercase">Reframe Mode</label>
              <select
                value={reframeMode}
                onChange={(e) => setReframeMode(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono text-foreground"
              >
                <option value="AUTO_REFRAME">Auto Reframe (Subject Tracking)</option>
                <option value="CENTER_CROP">Static Center Crop</option>
                <option value="SPLIT_LAYOUT">Split Screen Layout</option>
                <option value="BLURRED_BACKGROUND">Blurred Background</option>
              </select>
            </div>

            {/* Caption Preset */}
            <div className="space-y-1">
              <label className="text-muted block text-[10px] uppercase">Caption Preset</label>
              <select
                value={captionPreset}
                onChange={(e) => setCaptionPreset(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono text-foreground"
              >
                <option value="BOLD_SOCIAL">Bold Social (Yellow & White)</option>
                <option value="CLEAN">Clean Minimal Subtitle</option>
                <option value="PODCAST">Podcast Highlights Style</option>
                <option value="KARAOKE">Karaoke Active Highlight</option>
              </select>
            </div>

            {/* Created Short Clips List */}
            <div className="space-y-2 pt-2 border-t border-border">
              <h4 className="text-[11px] font-bold text-foreground uppercase">Created Short Clips ({clips.length})</h4>
              {clips.map((c: any, idx: number) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClipIndex(idx)}
                  className={`w-full p-3 rounded-xl border text-left font-mono text-xs transition-all cursor-pointer ${
                    selectedClipIndex === idx
                      ? "border-accent bg-accent/15 font-bold"
                      : "border-border bg-background text-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{c.name}</span>
                    <span className="text-accent">{c.duration.toFixed(1)}s</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
