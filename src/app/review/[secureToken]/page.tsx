import * as React from "react";
import type { Metadata } from "next";
import crypto from "crypto";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ShieldCheck, CheckCircle2, AlertTriangle, Play, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

interface RouteParams {
  params: Promise<{ secureToken: string }>;
}

export const metadata: Metadata = {
  title: "Client Project Review — VANTA AI",
  description: "External client review and approval portal for VANTA AI cinema projects.",
};

export default async function ExternalReviewPortalPage({ params }: RouteParams) {
  const resolved = await params;
  const tokenHash = crypto.createHash("sha256").update(resolved.secureToken).digest("hex");

  const link = await db.externalReviewLink.findUnique({
    where: { tokenHash },
  });

  if (!link || link.status !== "ACTIVE" || (link.expiresAt && link.expiresAt < new Date())) {
    return (
      <div className="min-h-screen bg-[#09090b] text-foreground flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3 font-mono">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Review Link Expired or Invalid</h2>
          <p className="text-xs text-muted">This external client review link is no longer active.</p>
        </div>
      </div>
    );
  }

  const project = await db.project.findUnique({
    where: { id: link.projectId },
    include: { scenes: { include: { shots: true } } },
  });

  if (!project) return notFound();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#09090b] text-foreground p-6 md:p-10 space-y-8 max-w-5xl mx-auto font-sans">
        {/* Header */}
        <div className="border-b border-border pb-6 flex items-center justify-between">
          <div>
            <Badge variant="outline" className="border-accent text-accent font-mono text-xs mb-2">
              CLIENT REVIEW PORTAL
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{project.name}</h1>
            <p className="text-xs text-muted font-mono mt-1">Reviewing video cuts and storyboard sequence.</p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            {link.allowApproval && (
              <Button className="bg-green-500 text-black font-bold text-xs h-10 px-5">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve Project
              </Button>
            )}
          </div>
        </div>

        {/* Video Player Mock */}
        <div className="aspect-video w-full rounded-3xl border border-border bg-surface flex items-center justify-center relative overflow-hidden shadow-2xl">
          <div className="text-center space-y-2">
            <Play className="h-12 w-12 text-accent mx-auto" />
            <span className="font-mono text-xs text-muted block">Client Video Preview Player ({project.aspectRatio})</span>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
