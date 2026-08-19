import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Clapperboard, Plus, Film, Clock, ArrowRight, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCinemaProjectsAction, createCinemaProjectAction } from "@/app/actions/cinema-actions";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Advanced Video Editor — VANTA AI",
  description: "Non-linear video editing workspace for multi-track composition.",
};

export default async function EditorPage() {
  const projects = await getCinemaProjectsAction();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-10 max-w-7xl mx-auto font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-accent font-mono text-xs font-semibold tracking-wider uppercase mb-1">
              <Clapperboard className="h-4 w-4" /> Non-Linear Editing Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              VANTA Advanced Video Editor
            </h1>
            <p className="text-sm text-muted mt-1 font-mono">
              Arrange clips, add transitions, text, captions, overlays, keyframes, and export non-destructively.
            </p>
          </div>

          <form action={async () => {
            "use server";
            await createCinemaProjectAction({ name: "Untitled Editor Project" });
          }}>
            <Button className="bg-accent text-accent-foreground font-bold text-xs h-11 px-6 rounded-xl shadow-lg hover:shadow-accent/20 cursor-pointer">
              <Plus className="h-4 w-4 mr-2" /> Create Editor Project
            </Button>
          </form>
        </div>

        {/* Projects Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Film className="h-5 w-5 text-accent" /> Editable Cinema & Studio Projects
          </h2>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted font-mono text-xs">
              No projects found. Create a project above or generate a video in Studio to start editing!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/editor/${project.id}`}
                  className="group p-5 rounded-2xl border border-border bg-surface transition-all hover:border-accent/50 hover:shadow-[0_0_25px_rgba(200,255,0,0.1)] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono border-border text-accent">
                        {project.aspectRatio}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                      {project.name}
                    </h3>

                    <p className="text-xs text-muted font-mono line-clamp-2">
                      {project.description || "Multi-track non-linear video editing workspace."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-mono">
                    <span className="text-muted">{project.scenes?.length || 1} Scene(s)</span>
                    <span className="text-accent font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Open Editor →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
