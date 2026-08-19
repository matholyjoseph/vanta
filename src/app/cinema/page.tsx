import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCinemaProjectsAction, createCinemaProjectAction } from "@/app/actions/cinema-actions";
import { Clapperboard, Plus, ArrowUpRight, Film, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "VANTA Cinema Studio — AI Film Workspace",
  description: "Professional multi-scene script breakdown, storyboard animation, and automated film timeline orchestration.",
};

export default async function CinemaProjectsPage() {
  const projects = await getCinemaProjectsAction();

  return (
    <ToastProvider>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto font-sans">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Clapperboard className="h-8 w-8 text-accent rotate-12" /> VANTA Cinema Studio
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              Professional multi-scene AI film orchestration workspace.
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await createCinemaProjectAction({ name: "New Film Production" });
            }}
          >
            <Button type="submit" className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5 cursor-pointer">
              <Plus className="h-4 w-4 mr-2" /> + New Film Project
            </Button>
          </form>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <Clapperboard className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No Cinema Projects Yet</h3>
            <p className="text-xs text-muted max-w-sm mx-auto font-mono">
              Create your first film project to break down scripts into scenes, shots, and storyboards.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj: any) => (
              <Link
                key={proj.id}
                href={`/cinema/${proj.id}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all hover:border-accent/50 hover:shadow-[0_0_25px_rgba(200,255,0,0.1)] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono text-accent border-accent/30">
                      {proj.aspectRatio || "16:9"}
                    </Badge>
                    <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-muted font-mono line-clamp-2 leading-relaxed">
                    {proj.description || "AI Film Workspace"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-mono text-muted">
                  <span>❖ {proj.scenes?.length || 0} Scenes</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(proj.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ToastProvider>
  );
}
