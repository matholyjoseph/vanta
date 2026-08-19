"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { shortsService } from "@/lib/shorts/shorts-service";
import { shortsHookService, HookType } from "@/lib/shorts/shorts-hook-service";
import { createCinemaProjectAction } from "@/app/actions/cinema-actions";
import { saveEditorProjectStateAction } from "@/app/actions/editor-actions";
import { EditorTimelineState } from "@/lib/editor/editor-types";

export async function createShortsProjectAction(params: { name?: string; sourceAssetId?: string }) {
  const user = await getAuthenticatedOrGuestUser();
  const project = await shortsService.createShortsProject(user.id, params);
  revalidatePath("/shorts");
  return project;
}

export async function getShortsProjectsAction() {
  const user = await getAuthenticatedOrGuestUser();
  return db.shortsProject.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      highlights: true,
      clips: { include: { exports: true } },
    },
  });
}

export async function getShortsProjectDetailsAction(projectId: string) {
  const user = await getAuthenticatedOrGuestUser();
  const project = await db.shortsProject.findFirst({
    where: { id: projectId, userId: user.id },
    include: {
      highlights: { orderBy: { score: "desc" } },
      clips: { include: { exports: true } },
    },
  });

  if (!project) throw new Error("Shorts project not found.");

  const sourceAsset = project.sourceAssetId
    ? await db.asset.findUnique({ where: { id: project.sourceAssetId } })
    : null;

  return {
    ...project,
    transcript: project.transcriptJson ? JSON.parse(project.transcriptJson) : [],
    sourceAsset,
  };
}

export async function analyzeShortsHighlightsAction(projectId: string, customInstruction?: string) {
  const user = await getAuthenticatedOrGuestUser();
  const project = await db.shortsProject.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) throw new Error("Project not found.");

  const transcript = project.transcriptJson ? JSON.parse(project.transcriptJson) : [];
  const updated = await shortsService.analyzeProjectHighlights(projectId, transcript);
  revalidatePath(`/shorts/${projectId}`);
  return updated;
}

export async function createShortClipAction(projectId: string, candidateId?: string, customParams?: any) {
  const user = await getAuthenticatedOrGuestUser();
  const project = await db.shortsProject.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) throw new Error("Project not found.");

  let candidate = null;
  if (candidateId) {
    candidate = await db.highlightCandidate.findUnique({ where: { id: candidateId } });
  }

  const clip = await db.shortClip.create({
    data: {
      shortsProjectId: projectId,
      highlightCandidateId: candidateId || null,
      name: customParams?.name || candidate?.title || "Manual Short Clip",
      sourceStart: customParams?.sourceStart ?? candidate?.startTime ?? 0,
      sourceEnd: customParams?.sourceEnd ?? candidate?.endTime ?? 30,
      duration: (customParams?.sourceEnd ?? candidate?.endTime ?? 30) - (customParams?.sourceStart ?? candidate?.startTime ?? 0),
      hookText: customParams?.hookText || candidate?.suggestedHook || "Check this out!",
      reframeMode: customParams?.reframeMode || "AUTO_REFRAME",
      status: "READY",
    },
  });

  revalidatePath(`/shorts/${projectId}`);
  return clip;
}

export async function rewriteShortHookAction(clipId: string, style: HookType) {
  const user = await getAuthenticatedOrGuestUser();
  const clip = await db.shortClip.findUnique({ where: { id: clipId } });
  if (!clip) throw new Error("Clip not found.");

  const newHook = shortsHookService.rewriteHook(clip.hookText || clip.name, style);

  const updated = await db.shortClip.update({
    where: { id: clipId },
    data: { hookText: newHook },
  });

  revalidatePath(`/shorts/${clip.shortsProjectId}`);
  return updated;
}

export async function batchExportShortsAction(projectId: string, clipIds: string[], platforms: string[]) {
  const user = await getAuthenticatedOrGuestUser();
  const assets = await shortsService.batchExportShorts(projectId, clipIds, platforms);
  revalidatePath(`/shorts/${projectId}`);
  revalidatePath("/assets");
  return assets;
}

export async function openShortInAdvancedEditorAction(clipId: string) {
  const user = await getAuthenticatedOrGuestUser();
  const clip = await db.shortClip.findUnique({
    where: { id: clipId },
    include: { project: true },
  });

  if (!clip) throw new Error("Clip not found.");

  // Create Cinema Project & Timeline state
  const cinemaProj = await createCinemaProjectAction({
    name: `Editor - ${clip.name}`,
    aspectRatio: "9:16",
  });

  const sampleUrl = "/werewolf_cinematic_preview.jpg";
  const initialTimelineState: EditorTimelineState = {
    projectId: cinemaProj.id,
    fps: 24,
    aspectRatio: "9:16",
    canvasWidth: 1080,
    canvasHeight: 1920,
    totalDuration: clip.duration,
    tracks: [
      {
        id: "tr_video_1",
        name: "Main Video Track",
        type: "VIDEO",
        muted: false,
        soloed: false,
        locked: false,
        hidden: false,
        volume: 1.0,
        clips: [
          {
            id: `clip_${clip.id}`,
            trackId: "tr_video_1",
            name: clip.name,
            sourceUrl: sampleUrl,
            mimeType: "video/mp4",
            sourceIn: clip.sourceStart,
            sourceOut: clip.sourceEnd,
            timelineStart: 0,
            timelineDuration: clip.duration,
            speed: 1.0,
            volume: 1.0,
            fadeIn: 0,
            fadeOut: 0,
            muted: false,
            transforms: { positionX: 0, positionY: 0, scale: 1, rotation: 0, opacity: 1, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 },
            effects: [],
            keyframes: [],
          },
        ],
        textLayers: [],
      },
      {
        id: "tr_text_1",
        name: "Hook & Titles",
        type: "TEXT",
        muted: false,
        soloed: false,
        locked: false,
        hidden: false,
        volume: 1.0,
        clips: [],
        textLayers: [
          {
            id: `text_hook_${clip.id}`,
            trackId: "tr_text_1",
            text: clip.hookText || "Hook Title",
            fontFamily: "Inter",
            fontSize: 48,
            fontWeight: "900",
            color: "#c8ff00",
            positionX: 0,
            positionY: -400,
            width: 800,
            alignment: "center",
            animation: "FADE",
            timelineStart: 0,
            timelineDuration: Math.min(3, clip.duration),
          },
        ],
      },
    ],
    transitions: [],
    captionSegments: [],
    duckingConfig: { enabled: true, duckAmountDb: -12, attackMs: 100, releaseMs: 300 },
  };

  await saveEditorProjectStateAction(cinemaProj.id, initialTimelineState);
  return { editorUrl: `/editor/${cinemaProj.id}` };
}
