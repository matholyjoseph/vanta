"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Clapperboard,
  Play,
  Film,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Tv,
  Smartphone,
  Video,
  ShoppingBag,
  Car,
  User,
  Music,
  Building,
  Layers,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createDirectorRunAction, duplicateDirectorRunAction } from "@/app/actions/director-actions";
import { ToastProvider, useToast } from "@/components/ui/toast";

const DIRECTOR_TEMPLATES = [
  { id: "luxury-car", name: "Luxury Commercial", icon: Car, prompt: "Create a 45-second luxury car commercial in Monaco at night. Mysterious female narrator, six cinematic shots, dramatic orchestral music." },
  { id: "product-ad", name: "Product Advertisement", icon: ShoppingBag, prompt: "Create a 30-second studio product ad for a high-end smartwatch with sleek liquid metal reflections." },
  { id: "movie-trailer", name: "Movie Trailer", icon: Film, prompt: "Create a 60-second sci-fi movie trailer with dramatic cinematic voiceover, explosive visuals, and heavy bass drops." },
  { id: "short-film", name: "Short Film Scene", icon: Clapperboard, prompt: "Create a 45-second suspenseful drama scene set in a rainy cafe window overlooking city lights." },
  { id: "music-video", name: "Music Video", icon: Music, prompt: "Create a 30-second neon cyberpunk music video with rhythmic camera cuts and synthwave aesthetic." },
  { id: "tiktok-reel", name: "TikTok / Reel", icon: Smartphone, prompt: "Create a 15-second fast-paced vertical video showcasing urban streetwear fashion in Tokyo." },
  { id: "real-estate", name: "Real Estate Promo", icon: Building, prompt: "Create a 30-second luxury architectural villa promo with golden hour sun flares and ambient piano music." },
  { id: "presenter", name: "Talking Presenter", icon: User, prompt: "Create a 30-second talking avatar presenter explaining AI video production features with natural gestures." },
];

export function DirectorHomeClient({ initialRuns = [] }: { initialRuns?: any[] }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [prompt, setPrompt] = React.useState("");
  const [template, setTemplate] = React.useState("");
  const [destination, setDestination] = React.useState("GENERIC");
  const [duration, setDuration] = React.useState("30s");
  const [aspectRatio, setAspectRatio] = React.useState("16:9");
  const [quality, setQuality] = React.useState<"ECONOMY" | "BALANCED" | "PREMIUM">("BALANCED");
  const [budgetPref, setBudgetPref] = React.useState<"USE_AVAILABLE" | "MAX_CREDITS" | "ASK">("ASK");
  const [creditBudget, setCreditBudget] = React.useState(500);
  const [isPlanning, setIsPlanning] = React.useState(false);

  const handleSelectTemplate = (tmpl: typeof DIRECTOR_TEMPLATES[0]) => {
    setTemplate(tmpl.id);
    setPrompt(tmpl.prompt);
  };

  const handlePlanProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      showToast("Please enter your creative instruction.", "error");
      return;
    }

    setIsPlanning(true);
    try {
      const run = await createDirectorRunAction({
        prompt,
        template,
        destination,
        duration,
        aspectRatio,
        qualityPreference: quality,
        budgetPreference: budgetPref,
        creditBudget,
      });

      showToast("Director Plan Ready. Navigating to Control Center...", "success");
      router.push(`/director/${run.id}`);
    } catch (err: any) {
      showToast(err?.message || "Failed to generate plan", "error");
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-10 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-accent font-mono text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="h-4 w-4" /> AI Autonomous Production Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            VANTA AI Director
          </h1>
          <p className="text-sm text-muted mt-1 font-mono">
            Describe your vision. VANTA automatically plans script, shots, voiceover, music, and timeline.
          </p>
        </div>

        <Badge variant="outline" className="text-xs font-mono text-accent border-accent/40 bg-accent/10 px-3 py-1.5">
          <Zap className="h-3.5 w-3.5 mr-1.5" /> AGENT MODE ACTIVE
        </Badge>
      </div>

      {/* Hero Interactive Form */}
      <div className="rounded-3xl border border-border bg-surface/50 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur">
        <div className="space-y-2">
          <label className="text-xl font-bold text-foreground block">
            What do you want to create?
          </label>
          <p className="text-xs text-muted font-mono">
            Enter a prompt, or choose a template below to auto-fill.
          </p>
        </div>

        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Create a 45-second luxury car commercial set in Monaco at night. Use a mysterious female voiceover, six cinematic shots, dramatic orchestral music..."
          className="w-full rounded-2xl border border-border bg-background/80 p-4 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent font-sans transition-all resize-none shadow-inner"
        />

        {/* Quick Settings Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
          {/* Destination */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-muted uppercase">Destination</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono focus:ring-1 focus:ring-accent"
            >
              <option value="GENERIC">Generic / Web</option>
              <option value="YOUTUBE">YouTube (16:9)</option>
              <option value="TIKTOK">TikTok (9:16)</option>
              <option value="REELS">Instagram Reels (9:16)</option>
              <option value="CINEMA">Cinema Film (16:9)</option>
              <option value="ADS">Commercial Ad</option>
            </select>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-muted uppercase">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono focus:ring-1 focus:ring-accent"
            >
              <option value="15s">15 Seconds</option>
              <option value="30s">30 Seconds</option>
              <option value="45s">45 Seconds</option>
              <option value="60s">60 Seconds</option>
            </select>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-muted uppercase">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono focus:ring-1 focus:ring-accent"
            >
              <option value="16:9">16:9 Widescreen</option>
              <option value="9:16">9:16 Vertical</option>
              <option value="1:1">1:1 Square</option>
            </select>
          </div>

          {/* Quality */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-muted uppercase">Quality Tier</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono focus:ring-1 focus:ring-accent"
            >
              <option value="ECONOMY">Economy (Fast & Cheap)</option>
              <option value="BALANCED">Balanced (Recommended)</option>
              <option value="PREMIUM">Premium 4K (Best Quality)</option>
            </select>
          </div>

          {/* Budget Limit */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-muted uppercase">Budget Safeguard</label>
            <input
              type="number"
              value={creditBudget}
              onChange={(e) => setCreditBudget(parseInt(e.target.value) || 100)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono focus:ring-1 focus:ring-accent"
              placeholder="Credit Budget"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="button"
            onClick={handlePlanProduction}
            disabled={isPlanning}
            className="bg-accent text-accent-foreground font-bold text-sm h-12 px-8 rounded-xl shadow-lg hover:shadow-accent/20 hover:scale-105 transition-all cursor-pointer"
          >
            {isPlanning ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-spin" /> Analyzing Prompt & Generating Plan...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Plan My Production →
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Starter Templates Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" /> Starter Production Templates
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {DIRECTOR_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = template === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tmpl)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(200,255,0,0.15)]"
                    : "border-border bg-surface/40 hover:border-accent/50 hover:bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  {isSelected && <Badge className="bg-accent text-accent-foreground text-[9px] font-bold">ACTIVE</Badge>}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">{tmpl.name}</h3>
                  <p className="text-[11px] text-muted font-mono line-clamp-2 mt-1 leading-relaxed">
                    {tmpl.prompt}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Director Run History Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" /> Recent Director Runs
        </h2>

        {initialRuns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted font-mono text-xs">
            No director runs executed yet. Enter a prompt above to create your first production plan!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialRuns.map((run) => (
              <Link
                key={run.id}
                href={`/director/${run.id}`}
                className="group p-5 rounded-2xl border border-border bg-surface transition-all hover:border-accent/50 hover:shadow-[0_0_25px_rgba(200,255,0,0.1)] space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono font-bold ${
                        run.status === "COMPLETED"
                          ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                          : run.status === "EXECUTING"
                          ? "border-accent text-accent bg-accent/10 animate-pulse"
                          : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                      }`}
                    >
                      {run.status}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted">
                      {new Date(run.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                    {run.creativeBrief?.title || run.originalPrompt.substring(0, 30)}
                  </h3>

                  <p className="text-xs text-muted font-mono line-clamp-2">
                    {run.originalPrompt}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-border/60">
                  <div className="flex justify-between text-[11px] font-mono text-muted">
                    <span>Progress: {run.progress}%</span>
                    <span>Cost: {run.estimatedCredits} Credits</span>
                  </div>

                  <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-accent h-full transition-all duration-500"
                      style={{ width: `${run.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
