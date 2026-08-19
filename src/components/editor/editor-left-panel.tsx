"use client";

import * as React from "react";
import {
  Film,
  Type,
  Subtitles,
  Music,
  Sliders,
  Sparkles,
  Layers,
  Search,
  Plus,
  Play,
  Volume2,
  MoveRight,
  ShieldAlert,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EditorLeftPanelProps {
  userAssets: any[];
  onAddMediaToTimeline: (asset: any) => void;
  onAddTextToTimeline: (preset: any) => void;
  onGenerateCaptions: () => void;
  onAddTransition: (type: string) => void;
  onAddEffect: (type: string) => void;
}

export function EditorLeftPanel({
  userAssets,
  onAddMediaToTimeline,
  onAddTextToTimeline,
  onGenerateCaptions,
  onAddTransition,
  onAddEffect,
}: EditorLeftPanelProps) {
  const [activeTab, setActiveTab] = React.useState<
    "media" | "text" | "captions" | "audio" | "transitions" | "effects" | "elements"
  >("media");

  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredAssets = userAssets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 border-r border-border bg-[#09090b] flex flex-col h-full shrink-0 font-sans select-none overflow-hidden">
      {/* Tab Selector Header */}
      <div className="flex items-center gap-1 p-2 border-b border-border overflow-x-auto scrollbar-none bg-surface/40">
        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "media" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          <Film className="h-3.5 w-3.5" /> Media
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("text")}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "text" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          <Type className="h-3.5 w-3.5" /> Text
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("captions")}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "captions" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          <Subtitles className="h-3.5 w-3.5" /> Captions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("audio")}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "audio" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          <Music className="h-3.5 w-3.5" /> Audio
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("transitions")}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "transitions" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          <MoveRight className="h-3.5 w-3.5" /> FX
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Tab 1: Media Library */}
        {activeTab === "media" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                placeholder="Search VANTA assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => onAddMediaToTimeline(asset)}
                  className="group relative aspect-video rounded-xl border border-border bg-surface overflow-hidden hover:border-accent cursor-pointer transition-all flex flex-col justify-between p-2"
                >
                  <img
                    src={asset.thumbnailUrl || asset.url}
                    alt={asset.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                  <Badge variant="outline" className="relative text-[9px] font-mono text-accent border-accent/40 bg-black/60 self-start">
                    {asset.type}
                  </Badge>

                  <div className="relative flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white truncate max-w-[80%]">{asset.name}</span>
                    <Plus className="h-3.5 w-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Text & Titles */}
        {activeTab === "text" && (
          <div className="space-y-4 font-mono text-xs">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Text Presets</h3>
            <div className="space-y-2">
              {[
                { title: "Main Title", font: "Inter", size: 56, weight: "900", color: "#ffffff" },
                { title: "Headline", font: "Inter", size: 42, weight: "700", color: "#c8ff00" },
                { title: "Subtitle", font: "Inter", size: 28, weight: "500", color: "#a1a1aa" },
                { title: "Lower Third", font: "Inter", size: 24, weight: "600", color: "#ffffff" },
                { title: "Callout CTA", font: "Inter", size: 32, weight: "800", color: "#c8ff00" },
              ].map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onAddTextToTimeline(tmpl)}
                  className="w-full p-3 rounded-xl border border-border bg-surface/60 text-left hover:border-accent hover:bg-surface transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className="font-bold text-foreground">{tmpl.title}</span>
                  <Plus className="h-3.5 w-3.5 text-accent" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Auto-Captions */}
        {activeTab === "captions" && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 rounded-2xl border border-border bg-surface/50 space-y-3">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-accent" /> Auto-Caption Generator
              </h3>
              <p className="text-[11px] text-muted leading-relaxed">
                Automatically transcribe voiceover and dialogue audio tracks into synchronized captions.
              </p>
              <Button
                type="button"
                onClick={onGenerateCaptions}
                className="w-full bg-accent text-accent-foreground font-bold text-xs h-10 rounded-xl cursor-pointer"
              >
                Generate Auto-Captions
              </Button>
            </div>
          </div>
        )}

        {/* Tab 4: Audio Library */}
        {activeTab === "audio" && (
          <div className="space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Audio Tracks</h3>
            {[
              { name: "Cinematic Ambient Score", type: "MUSIC", duration: "30s" },
              { name: "Dramatic Sub Drop Whoosh", type: "SFX", duration: "3s" },
              { name: "Futuristic Glitch Transition", type: "SFX", duration: "2s" },
            ].map((aud, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-border bg-surface/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-accent" />
                  <div>
                    <div className="font-bold text-foreground text-xs">{aud.name}</div>
                    <div className="text-[10px] text-muted">{aud.type} · {aud.duration}</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-accent">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Transitions & FX */}
        {activeTab === "transitions" && (
          <div className="space-y-4 font-mono text-xs">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Video Transitions</h3>
            <div className="grid grid-cols-2 gap-2">
              {["CROSS_DISSOLVE", "FADE_BLACK", "SLIDE_LEFT", "PUSH", "ZOOM", "WIPE"].map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => onAddTransition(tr)}
                  className="p-3 rounded-xl border border-border bg-surface/60 text-left hover:border-accent transition-all cursor-pointer"
                >
                  <span className="font-bold text-foreground text-[11px] block">{tr.replace("_", " ")}</span>
                  <span className="text-[9px] text-muted font-mono">1.0s Duration</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
