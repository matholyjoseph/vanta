"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Film,
  Sparkles,
  FolderPlus,
  Upload,
  ArrowUpRight,
  Plus,
  Clock,
  Loader2,
  Trash2,
  RefreshCw,
  Download,
  ImageIcon,
  Smartphone,
  Clapperboard,
  Tv,
  Music,
  ShoppingBag,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewProjectModal } from "@/components/dashboard/new-project-modal";
import { UploadMediaModal } from "@/components/dashboard/upload-media-modal";
import { deleteGenerationAction } from "@/app/actions/dashboard";
import { useToast } from "@/components/ui/toast";

export interface DashboardGeneration {
  id: string;
  mediaType?: string;
  prompt: string;
  model: string | { name: string } | null;
  status: string;
  progress?: number;
  resolution: string;
  duration: string;
  fps: number;
  seed: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  isFavorite?: boolean;
  error?: string | null;
  createdAt: Date;
}

export interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: string;
  sceneCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardContentProps {
  userName: string;
  generations: DashboardGeneration[];
  projects: DashboardProject[];
}

const TEMPLATES = [
  {
    id: "tiktok-story",
    title: "TikTok / Story",
    description: "9:16 Vertical Format",
    icon: Smartphone,
    aspectRatio: "9:16",
  },
  {
    id: "cinematic-trailer",
    title: "Cinematic Trailer",
    description: "2.35:1 Ultrawide",
    icon: Clapperboard,
    aspectRatio: "21:9",
  },
  {
    id: "cinematic-commercial",
    title: "Product Commercial",
    description: "16:9 4K Landscape",
    icon: Tv,
    aspectRatio: "16:9",
  },
  {
    id: "music-video",
    title: "Music Video",
    description: "Dynamic visualizer sequence",
    icon: Music,
    aspectRatio: "16:9",
  },
  {
    id: "product-ad",
    title: "Product Advertisement",
    description: "E-commerce & SaaS showcase",
    icon: ShoppingBag,
    aspectRatio: "1:1",
  },
  {
    id: "talking-character",
    title: "Talking Character",
    description: "Consistent avatar sync",
    icon: UserCheck,
    aspectRatio: "16:9",
  },
];

export function DashboardContent({
  userName,
  generations: initialGenerations,
  projects,
}: DashboardContentProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [generations, setGenerations] = React.useState<DashboardGeneration[]>(initialGenerations);
  const [newProjectOpen, setNewProjectOpen] = React.useState(false);
  const [uploadMediaOpen, setUploadMediaOpen] = React.useState(false);
  const [previewGen, setPreviewGen] = React.useState<DashboardGeneration | null>(null);

  // Quick action handles
  const handleQuickAction = (action: string) => {
    switch (action) {
      case "generate":
        router.push("/studio/video");
        break;
      case "image":
        router.push("/studio/image");
        break;
      case "animate":
        router.push("/studio/video?mode=image-to-video");
        break;
      case "project":
        setNewProjectOpen(true);
        break;
      case "upload":
        setUploadMediaOpen(true);
        break;
    }
  };

  // Delete Generation Handler
  const handleDeleteGeneration = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteGenerationAction(id);
      setGenerations((prev) => prev.filter((g) => g.id !== id));
      showToast("Generation record deleted", "info");
    } catch {
      showToast("Failed to delete generation", "error");
    }
  };

  // Remix Generation Handler
  const handleRemix = (gen: DashboardGeneration, e: React.MouseEvent) => {
    e.stopPropagation();
    if (gen.mediaType === "IMAGE") {
      router.push(`/studio/image?prompt=${encodeURIComponent(gen.prompt)}`);
    } else {
      router.push(`/studio/video?prompt=${encodeURIComponent(gen.prompt)}`);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto font-sans">
      {/* Welcome Banner Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {userName}
        </h1>
        <p className="text-sm text-muted font-mono">
          Your Vanta engine is primed. What are we building today?
        </p>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Action 0: AI Director Banner */}
        <Link
          href="/director"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-surface to-surface border border-accent/40 p-5 text-left transition-all hover:border-accent hover:shadow-[0_0_30px_rgba(200,255,0,0.2)] flex flex-col justify-between h-36 cursor-pointer sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-accent text-accent-foreground font-bold shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-[9px] font-mono text-accent border-accent/40">AGENT MODE</Badge>
          </div>
          <div>
            <div className="font-extrabold text-base text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
              AI Director <ArrowUpRight className="h-4 w-4 text-accent" />
            </div>
            <p className="text-xs text-muted mt-0.5 font-mono line-clamp-1">
              Autonomous Video Production
            </p>
          </div>
        </Link>

        {/* Action 1: Video Studio */}
        <button
          onClick={() => handleQuickAction("generate")}
          className="group relative overflow-hidden rounded-2xl bg-surface border border-border p-5 text-left transition-all hover:border-accent/50 hover:shadow-[0_0_25px_rgba(200,255,0,0.1)] flex flex-col justify-between h-36 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-surface-hover group-hover:bg-accent/15 group-hover:text-accent transition-colors text-foreground">
              <Film className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
          </div>
          <div>
            <div className="font-bold text-base text-foreground group-hover:text-accent transition-colors">
              Video Studio
            </div>
            <p className="text-xs text-muted mt-0.5 font-mono">
              Text & Image-to-Video Engine
            </p>
          </div>
        </button>

        {/* Action 2: Image Studio */}
        <button
          onClick={() => handleQuickAction("image")}
          className="group relative overflow-hidden rounded-2xl bg-surface border border-border p-5 text-left transition-all hover:border-accent/50 hover:shadow-[0_0_25px_rgba(200,255,0,0.1)] flex flex-col justify-between h-36 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-surface-hover group-hover:bg-accent/15 group-hover:text-accent transition-colors text-foreground">
              <ImageIcon className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
          </div>
          <div>
            <div className="font-bold text-base text-foreground group-hover:text-accent transition-colors">
              Image Studio
            </div>
            <p className="text-xs text-muted mt-0.5 font-mono">
              AI Image & Product Staging
            </p>
          </div>
        </button>

        {/* Action 3: Create Project */}
        <button
          onClick={() => handleQuickAction("project")}
          className="group relative overflow-hidden rounded-2xl bg-surface border border-border p-5 text-left transition-all hover:border-accent/50 hover:shadow-[0_0_25px_rgba(200,255,0,0.1)] flex flex-col justify-between h-36 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-surface-hover group-hover:bg-accent/15 group-hover:text-accent transition-colors text-foreground">
              <FolderPlus className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
          </div>
          <div>
            <div className="font-bold text-base text-foreground group-hover:text-accent transition-colors">
              Create Project
            </div>
            <p className="text-xs text-muted mt-0.5 font-mono">
              Multi-scene timeline
            </p>
          </div>
        </button>

        {/* Action 4: Upload Media */}
        <button
          onClick={() => handleQuickAction("upload")}
          className="group relative overflow-hidden rounded-2xl bg-surface border border-border p-5 text-left transition-all hover:border-accent/50 hover:shadow-[0_0_25px_rgba(200,255,0,0.1)] flex flex-col justify-between h-36 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-surface-hover group-hover:bg-accent/15 group-hover:text-accent transition-colors text-foreground">
              <Upload className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
          </div>
          <div>
            <div className="font-bold text-base text-foreground group-hover:text-accent transition-colors">
              Upload Media
            </div>
            <p className="text-xs text-muted mt-0.5 font-mono">
              Assets & audio
            </p>
          </div>
        </button>
      </div>

      {/* Main Grid: Recent Generations (Left) + Projects & Quick Start (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Recent Generations */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Recent Generations
            </h2>
            <Link
              href="/assets"
              className="text-xs font-mono text-muted hover:text-accent flex items-center gap-1 transition-colors"
            >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {generations.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-8 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center text-muted">
                <Film className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No generations yet
              </p>
              <p className="text-xs text-muted max-w-sm mx-auto font-mono">
                Generate your first AI video or image in Studio.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button onClick={() => router.push("/studio/video")} className="bg-accent text-accent-foreground font-bold text-xs">
                  Video Studio →
                </Button>
                <Button onClick={() => router.push("/studio/image")} variant="outline" className="text-xs border-border">
                  Image Studio →
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {generations.map((gen) => (
                <div
                  key={gen.id}
                  onClick={() => setPreviewGen(gen)}
                  className="group relative overflow-hidden rounded-2xl bg-surface border border-border p-4 transition-all hover:border-accent/40 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                    {/* Media Thumbnail or Generating Spinner */}
                    <div className="relative aspect-video w-32 shrink-0 rounded-xl bg-background border border-border/80 overflow-hidden flex items-center justify-center bg-gradient-to-br from-emerald-950/40 via-surface to-background">
                      {gen.status === "generating" ? (
                        <Loader2 className="h-6 w-6 text-accent animate-spin" />
                      ) : gen.mediaType === "IMAGE" ? (
                        <ImageIcon className="h-6 w-6 text-accent" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/15 transition-colors" />
                          <Film className="h-6 w-6 text-muted group-hover:text-accent transition-colors" />
                          <span className="absolute bottom-1 right-1 font-mono text-[9px] bg-black/80 px-1 py-0.5 rounded text-foreground">
                            {gen.duration || "0s"}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Metadata & Prompt */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap font-mono">
                        <Badge variant="outline" className="text-accent border-accent/30 text-[10px]">
                          {gen.mediaType || "VIDEO"}
                        </Badge>
                        <Badge variant="outline" className="text-muted border-border text-[10px]">
                          {typeof gen.model === "object" ? gen.model?.name : gen.model || "Vanta Engine"}
                        </Badge>
                        <span className="text-[10px] text-muted flex items-center gap-1 ml-auto sm:ml-0">
                          <Clock className="h-3 w-3" />
                          {new Date(gen.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed italic">
                        &ldquo;{gen.prompt}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleRemix(gen, e)}
                      title="Remix prompt"
                      className="h-8 px-2.5 text-xs text-muted hover:text-accent"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Remix
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleDeleteGeneration(gen.id, e)}
                      title="Delete"
                      className="h-8 px-2 text-xs text-muted hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Column: My Projects & Quick Start Templates */}
        <div className="space-y-8">
          {/* My Projects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                My Projects
              </h2>
              <button
                onClick={() => setNewProjectOpen(true)}
                className="p-1 rounded-lg bg-surface hover:bg-surface-hover border border-border text-foreground hover:text-accent transition-colors"
                title="Create New Project"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center space-y-2">
                <p className="text-xs text-muted">No projects created yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNewProjectOpen(true)}
                  className="text-xs"
                >
                  + New Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {projects.map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/projects/${proj.id}`}
                    className="group flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border hover:border-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-10 rounded-lg bg-background border border-border/80 flex items-center justify-center shrink-0">
                        <Clapperboard className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors truncate">
                          {proj.name}
                        </h3>
                        <p className="text-[11px] font-mono text-muted">
                          ❖ {proj.sceneCount} {proj.sceneCount === 1 ? "Scene" : "Scenes"}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
