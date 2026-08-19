"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Sparkles,
  Upload,
  Film,
  FolderOpen,
  Plus,
  Play,
  Scissors,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createShortsProjectAction } from "@/app/actions/shorts-actions";
import { useToast } from "@/components/ui/toast";

export function ShortsHomeClient({ initialProjects = [], userAssets = [] }: { initialProjects?: any[]; userAssets?: any[] }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [selectedAssetId, setSelectedAssetId] = React.useState<string>("");
  const [projectName, setProjectName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreateShorts = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const project = await createShortsProjectAction({
        name: projectName || undefined,
        sourceAssetId: selectedAssetId || undefined,
      });

      showToast("Shorts Project Initialized! Analyzing transcript...", "success");
      router.push(`/shorts/${project.id}`);
    } catch (err: any) {
      showToast(err?.message || "Failed to create shorts project", "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-10 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-accent font-mono text-xs font-semibold tracking-wider uppercase mb-1">
            <Smartphone className="h-4 w-4" /> AI Viral Social Clipping Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            VANTA Shorts Studio
          </h1>
          <p className="text-sm text-muted mt-1 font-mono">
            Turn long videos into scroll-stopping 9:16 vertical shorts for TikTok, Instagram Reels, and YouTube Shorts.
          </p>
        </div>

        <Badge variant="outline" className="text-xs font-mono text-accent border-accent/40 bg-accent/10 px-3 py-1.5">
          <Zap className="h-3.5 w-3.5 mr-1.5" /> AUTO REFRAME ACTIVE
        </Badge>
      </div>

      {/* Hero Section Card */}
      <div className="rounded-3xl border border-border bg-surface/50 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            Turn Long Videos Into Scroll-Stopping Shorts
          </h2>
          <p className="text-xs text-muted font-mono">
            Upload a long recording or select a video from your VANTA Asset Library to automatically detect viral highlights.
          </p>
        </div>

        {/* Source Video Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Option 1: Select Asset */}
          <div className="p-4 rounded-2xl border border-border bg-background/80 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-foreground">
              <FolderOpen className="h-4 w-4 text-accent" /> Choose From Assets
            </div>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground font-mono focus:ring-1 focus:ring-accent"
            >
              <option value="">-- Select VANTA Video Asset --</option>
              {userAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.duration || "Video"})
                </option>
              ))}
            </select>
          </div>

          {/* Option 2: Project Title Input */}
          <div className="p-4 rounded-2xl border border-border bg-background/80 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-foreground">
              <Film className="h-4 w-4 text-accent" /> Project Name
            </div>
            <input
              type="text"
              placeholder="e.g. Podcast Episode 42 Highlights"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground font-mono focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Option 3: Target Platform */}
          <div className="p-4 rounded-2xl border border-border bg-background/80 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-foreground">
              <Smartphone className="h-4 w-4 text-accent" /> Target Format
            </div>
            <select className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground font-mono">
              <option value="9:16">9:16 Vertical (TikTok, Reels, Shorts)</option>
              <option value="1:1">1:1 Square Feed</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={handleCreateShorts}
            disabled={isCreating}
            className="bg-accent text-accent-foreground font-bold text-xs h-12 px-8 rounded-xl shadow-lg hover:shadow-accent/20 hover:scale-105 transition-all cursor-pointer"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-spin" /> Transcribing & Detecting Highlights...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Create Shorts Project →
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Recent Shorts Projects Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Scissors className="h-5 w-5 text-accent" /> Recent Shorts Projects
        </h2>

        {initialProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted font-mono text-xs">
            No shorts projects created yet. Select a video above to generate your first social shorts!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialProjects.map((project) => (
              <Link
                key={project.id}
                href={`/shorts/${project.id}`}
                className="group p-5 rounded-2xl border border-border bg-surface transition-all hover:border-accent/50 hover:shadow-[0_0_25px_rgba(200,255,0,0.1)] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono border-border text-accent">
                      {project.status}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                    {project.name}
                  </h3>

                  <p className="text-xs text-muted font-mono line-clamp-2">
                    {project.highlights?.length || 0} Highlight Candidates Detected
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-mono">
                  <span className="text-muted">{project.clips?.length || 0} Short Clip(s)</span>
                  <span className="text-accent font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Open Shorts Studio →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
