"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Clock, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { GALLERY_ITEMS, type GalleryItem } from "@/lib/constants";

// Map gradient Tailwind classes to actual CSS gradients for inline style usage
const GRADIENT_CSS: Record<string, string> = {
  "from-emerald-500/30 via-cyan-500/20 to-transparent":
    "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,182,212,0.2), transparent)",
  "from-purple-500/30 via-pink-500/20 to-transparent":
    "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.2), transparent)",
  "from-lime-500/30 via-yellow-500/20 to-transparent":
    "linear-gradient(135deg, rgba(132,204,22,0.3), rgba(234,179,8,0.2), transparent)",
  "from-orange-500/30 via-red-500/20 to-transparent":
    "linear-gradient(135deg, rgba(249,115,22,0.3), rgba(239,68,68,0.2), transparent)",
  "from-slate-400/30 via-zinc-500/20 to-transparent":
    "linear-gradient(135deg, rgba(148,163,184,0.3), rgba(113,113,122,0.2), transparent)",
  "from-green-500/30 via-teal-500/20 to-transparent":
    "linear-gradient(135deg, rgba(34,197,94,0.3), rgba(20,184,166,0.2), transparent)",
};

function getGradientCSS(gradientKey: string): string {
  return (
    GRADIENT_CSS[gradientKey] ||
    "linear-gradient(135deg, rgba(200,255,0,0.15), rgba(20,184,166,0.1), transparent)"
  );
}

export default function Gallery() {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render animated modal video stream canvas when item is opened
  useEffect(() => {
    if (!selectedItem) return;
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    let time = 0;

    const render = () => {
      time += isPlaying ? 0.04 : 0.005;
      const width = (canvas.width = canvas.clientWidth);
      const height = (canvas.height = canvas.clientHeight);

      ctx.clearRect(0, 0, width, height);

      // Base gradient stream
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#080c14");
      bgGrad.addColorStop(0.5, "#112233");
      bgGrad.addColorStop(1, "#090d16");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Moving animated grid / waves
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle =
          i === 0
            ? "rgba(200, 255, 0, 0.45)"
            : i === 1
            ? "rgba(56, 189, 248, 0.35)"
            : "rgba(168, 85, 247, 0.3)";

        for (let x = 0; x < width; x += 20) {
          const y =
            height / 2 +
            Math.sin(x * 0.01 + time + i * 2) * (40 + i * 10) +
            Math.cos(time * 1.5) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Particle sparkles
      for (let p = 0; p < 30; p++) {
        const px = (Math.sin(p * 17 + time) * 0.5 + 0.5) * width;
        const py = (Math.cos(p * 23 + time * 1.2) * 0.5 + 0.5) * height;
        ctx.beginPath();
        ctx.arc(px, py, (p % 4) + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = p % 2 === 0 ? "#c8ff00" : "#38bdf8";
        ctx.fill();
      }

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [selectedItem, isPlaying]);

  return (
    <section id="community" className="py-20 md:py-28 bg-background relative">
      <div id="explore" className="absolute -top-24 left-0" />
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Community Generations
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Explore what creators are building with Vanta AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_ITEMS.map((item) => (
            <article
              key={item.id}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:scale-[1.02] hover:border-accent/40 hover:shadow-[0_0_24px_rgba(200,255,0,0.1)]"
              onClick={() => setSelectedItem(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedItem(item);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View generation: ${item.prompt.slice(0, 60)}...`}
            >
              <div
                className="aspect-video w-full bg-background relative overflow-hidden"
                style={{
                  background: item.thumbnailUrl
                    ? `url('${item.thumbnailUrl}') center/cover no-repeat`
                    : `${getGradientCSS(item.gradient)}, #09090b`,
                }}
              >
                {/* Subtle pulse animation indicator on thumbnail */}
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Duration badge */}
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-foreground font-mono">
                <Clock className="w-3 h-3 text-accent" />
                <span>{item.duration}</span>
              </div>

              {/* Bottom overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="secondary"
                    className="bg-surface/80 text-foreground backdrop-blur-sm text-[10px] font-mono border border-border"
                  >
                    {item.model}
                  </Badge>
                  <Play className="w-7 h-7 text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                </div>
                <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed font-sans">
                  {item.prompt}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Preview Animated Video Modal */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent className="max-w-3xl bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="sr-only">Generation Video Preview</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="flex flex-col space-y-5">
              {/* Interactive Animated Canvas Player */}
              <div
                className="relative aspect-video w-full rounded-xl border border-accent/40 bg-background overflow-hidden group shadow-2xl"
                style={{
                  background: selectedItem.thumbnailUrl
                    ? `url('${selectedItem.thumbnailUrl}') center/cover no-repeat`
                    : "transparent",
                }}
              >
                <canvas ref={modalCanvasRef} className="w-full h-full object-cover block opacity-75 mix-blend-screen" />

                {/* Video Play Overlay Button */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-16 w-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                    aria-label={isPlaying ? "Pause preview" : "Play preview"}
                  >
                    {isPlaying ? (
                      <Pause className="h-7 w-7 fill-current" />
                    ) : (
                      <Play className="h-7 w-7 fill-current ml-1" />
                    )}
                  </button>
                </div>

                {/* Top Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-accent border border-white/10">
                  <Sparkles className="w-3 h-3" />
                  <span>ANIMATED AI VIDEO PREVIEW</span>
                </div>
              </div>

              {/* Prompt */}
              <div className="bg-background rounded-xl p-4 border border-border">
                <div className="text-[10px] uppercase tracking-widest text-accent font-mono mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Generation Prompt
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedItem.prompt}
                </p>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
                {[
                  { label: "Model", value: selectedItem.model },
                  { label: "Resolution", value: selectedItem.resolution },
                  { label: "Duration", value: selectedItem.duration },
                  { label: "FPS", value: selectedItem.fps },
                  { label: "Seed", value: selectedItem.seed },
                ].map((meta) => (
                  <div
                    key={meta.label}
                    className="bg-background p-3 rounded-lg border border-border"
                  >
                    <div className="text-[10px] text-muted uppercase tracking-wider mb-1">
                      {meta.label}
                    </div>
                    <div className="text-xs font-bold text-foreground truncate">
                      {meta.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
