import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MODELS } from "@/lib/constants";
import { AI_MODELS_REGISTRY } from "@/lib/models-config";
import { getModelStudioUrl } from "@/lib/model-routing";
import { Cpu, ArrowRight, Sparkles, Film, ImageIcon, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "AI Generation Models Registry — VANTA AI",
  description: "Browse photorealistic video, image, audio, and avatar generation engines.",
};

export default function ModelsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 space-y-12 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto border-b border-border pb-10">
        <Badge variant="outline" className="border-accent text-accent font-mono text-xs">
          MODEL REGISTRY & ENGINES
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Generative AI Engines
        </h1>
        <p className="text-muted text-base font-mono">
          Command industry-leading video, image, audio, and avatar models from a single workspace.
        </p>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
        {MODELS.map((model) => {
          const studioUrl = getModelStudioUrl({ id: model.id, name: model.name, mediaType: "VIDEO" });

          return (
            <div
              key={model.id}
              className="p-8 rounded-3xl border border-border bg-surface/50 space-y-6 flex flex-col justify-between hover:border-accent/40 transition-all shadow-2xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-extrabold text-foreground">{model.name}</h3>
                  {model.badge && (
                    <Badge variant="outline" className="border-accent text-accent font-mono text-xs">
                      {model.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-muted text-sm leading-relaxed">{model.description}</p>

                <div className="grid grid-cols-3 gap-3 pt-3 font-mono text-xs border-t border-border">
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Resolution</span>
                    <span className="font-bold text-foreground">{model.resolution}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">FPS</span>
                    <span className="font-bold text-foreground">{model.fps}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Duration</span>
                    <span className="font-bold text-foreground">{model.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 font-mono text-xs">
                <Link href={studioUrl} className="flex-1">
                  <Button className="w-full bg-accent text-accent-foreground font-bold h-11 text-xs rounded-xl cursor-pointer">
                    Try Model in Studio <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>

                <Link href={`/models/${model.id}`}>
                  <Button variant="outline" className="border-border h-11 px-4 rounded-xl cursor-pointer font-bold">
                    View Specs
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
