import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { resolveModelFromSlug, getModelStudioUrl } from "@/lib/model-routing";
import { Cpu, ArrowRight, CheckCircle2, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await params;
  const { model } = resolveModelFromSlug(resolved.slug);
  return {
    title: `${model.name} — AI Model Specs & Studio Launch`,
    description: model.description,
  };
}

export default async function ModelDetailPage({ params }: RouteParams) {
  const resolved = await params;
  const { found, model } = resolveModelFromSlug(resolved.slug);
  const studioUrl = getModelStudioUrl({ slug: resolved.slug, name: model.name, mediaType: "VIDEO" });

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 space-y-8 max-w-4xl mx-auto font-sans">
      <Link href="/models" className="text-muted hover:text-foreground font-mono text-xs block mb-2">
        ← Back to All Models
      </Link>

      <div className="p-8 rounded-3xl border border-border bg-surface/50 space-y-6 font-mono shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="border-accent text-accent text-xs">
              OFFICIAL MODEL REGISTRY
            </Badge>
            <h1 className="text-3xl font-extrabold text-foreground">{model.name}</h1>
          </div>

          <Link href={studioUrl}>
            <Button className="bg-accent text-accent-foreground font-bold text-xs h-11 px-6 rounded-xl cursor-pointer">
              Try Model <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        <p className="text-muted font-sans text-sm leading-relaxed">{model.description}</p>

        {/* Specs Table */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl border border-border bg-background text-xs">
          <div>
            <span className="text-[10px] text-muted uppercase block">Resolution</span>
            <span className="font-bold text-foreground">{"resolution" in model ? model.resolution : "1080p - 4K"}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase block">FPS</span>
            <span className="font-bold text-foreground">{"fps" in model ? model.fps : "24-60"}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase block">Max Duration</span>
            <span className="font-bold text-foreground">{"duration" in model ? model.duration : "Up to 16s"}</span>
          </div>
        </div>

        {/* Action Callout */}
        <div className="p-6 rounded-2xl border border-accent/30 bg-accent/10 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="font-bold text-foreground">Ready to test {model.name}?</h4>
            <p className="text-xs text-muted font-sans">Open Studio directly with {model.name} pre-selected.</p>
          </div>

          <Link href={studioUrl}>
            <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5 rounded-xl cursor-pointer">
              Launch Studio Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
