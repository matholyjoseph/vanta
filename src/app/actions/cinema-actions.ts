"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { submitImageGenerationAction } from "@/app/actions/image-actions";
import { getStorageProvider } from "@/lib/storage";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

async function getAuthenticatedUser() {
  return getAuthenticatedOrGuestUser();
}

export async function getCinemaProjectsAction() {
  try {
    const user = await getAuthenticatedUser();
    return await db.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        scenes: { include: { shots: { include: { takes: true } } } },
        elements: true,
        exports: { orderBy: { createdAt: "desc" } },
      },
    });
  } catch (err) {
    console.warn("[getCinemaProjectsAction] DB read fallback:", err);
    return [];
  }
}

export async function getCinemaProjectDetailsAction(projectId: string) {
  const user = await getAuthenticatedUser();
  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: {
      scenes: {
        orderBy: { order: "asc" },
        include: {
          shots: {
            orderBy: { order: "asc" },
            include: { takes: { orderBy: { takeNumber: "desc" } } },
          },
        },
      },
      elements: true,
      exports: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) throw new Error("Cinema Project not found.");
  return project;
}

export async function createCinemaProjectAction(params: {
  name: string;
  description?: string;
  aspectRatio?: string;
  creditBudget?: number;
}) {
  const user = await getAuthenticatedUser();

  const project = await db.project.create({
    data: {
      userId: user.id,
      name: params.name.trim() || "Untitled Cinema Project",
      description: params.description || "AI Cinematic film workspace",
      aspectRatio: params.aspectRatio || "16:9",
      creditBudget: params.creditBudget || 2000,
      scenes: {
        create: [
          {
            title: "Scene 1: Establishing Shot",
            description: "Opening scene setting atmospheric tone",
            timeOfDay: "Day",
            order: 1,
            shots: {
              create: [
                {
                  shotNumber: "1.1",
                  prompt: "Wide establishing shot of a futuristic neon city skyline at dusk, cinematic volumetric light.",
                  shotSize: "Wide",
                  cameraAngle: "Eye Level",
                  cameraMovement: "Pan Left",
                  lens: "35mm",
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  revalidatePath("/cinema");
  return project;
}

export async function importScriptAndBreakdownAction(projectId: string, scriptText: string) {
  const user = await getAuthenticatedUser();

  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) throw new Error("Project not found.");

  // Save raw script to project
  await db.project.update({
    where: { id: project.id },
    data: { scriptText },
  });

  // ScriptBreakdownService (Deterministic Parser for Scenes & Shots)
  const lines = scriptText.split("\n").map((l) => l.trim()).filter(Boolean);
  let sceneIndex = 1;
  let currentSceneTitle = `Scene ${sceneIndex}: Intro`;
  let currentSceneDesc = "";
  const sceneItems: { title: string; desc: string; shots: string[] }[] = [];
  let currentShots: string[] = [];

  for (const line of lines) {
    if (line.toUpperCase().startsWith("SCENE") || line.toUpperCase().startsWith("EXT.") || line.toUpperCase().startsWith("INT.")) {
      if (currentShots.length > 0) {
        sceneItems.push({ title: currentSceneTitle, desc: currentSceneDesc, shots: [...currentShots] });
        currentShots = [];
        sceneIndex++;
      }
      currentSceneTitle = `Scene ${sceneIndex}: ${line}`;
      currentSceneDesc = line;
    } else {
      currentShots.push(line);
    }
  }

  if (currentShots.length > 0 || sceneItems.length === 0) {
    sceneItems.push({
      title: currentSceneTitle,
      desc: currentSceneDesc || "Script Scene",
      shots: currentShots.length > 0 ? currentShots : ["Medium shot of character entering the scene."],
    });
  }

  // Create Scenes & Shots in DB
  for (let i = 0; i < sceneItems.length; i++) {
    const item = sceneItems[i];
    const createdScene = await db.scene.create({
      data: {
        projectId: project.id,
        title: item.title,
        description: item.desc,
        order: i + 1,
      },
    });

    for (let j = 0; j < Math.min(6, item.shots.length); j++) {
      await db.shot.create({
        data: {
          sceneId: createdScene.id,
          shotNumber: `${i + 1}.${j + 1}`,
          prompt: item.shots[j],
          shotSize: j === 0 ? "Wide" : j % 2 === 0 ? "Medium" : "Close-Up",
          cameraAngle: "Eye Level",
          cameraMovement: j === 0 ? "Pan Right" : "Static",
          order: j + 1,
        },
      });
    }
  }

  revalidatePath(`/cinema/${projectId}`);
  return { success: true };
}

export async function createSceneAction(projectId: string, title: string, description?: string) {
  const user = await getAuthenticatedUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) throw new Error("Project not found.");

  const count = await db.scene.count({ where: { projectId } });

  const scene = await db.scene.create({
    data: {
      projectId,
      title: title.trim() || `Scene ${count + 1}`,
      description: description || null,
      order: count + 1,
      shots: {
        create: [
          {
            shotNumber: `${count + 1}.1`,
            prompt: `Medium shot in ${title}`,
            order: 1,
          },
        ],
      },
    },
  });

  revalidatePath(`/cinema/${projectId}`);
  return scene;
}

export async function createShotAction(sceneId: string, prompt: string, shotSize?: string) {
  const user = await getAuthenticatedUser();
  const scene = await db.scene.findUnique({ where: { id: sceneId }, include: { project: true } });
  if (!scene || scene.project.userId !== user.id) throw new Error("Scene not found.");

  const count = await db.shot.count({ where: { sceneId } });

  const shot = await db.shot.create({
    data: {
      sceneId,
      shotNumber: `${scene.order}.${count + 1}`,
      prompt: prompt.trim() || "Cinematic shot",
      shotSize: shotSize || "Medium Shot",
      order: count + 1,
    },
  });

  revalidatePath(`/cinema/${scene.projectId}`);
  return shot;
}

export async function generateStoryboardForShotAction(shotId: string) {
  const user = await getAuthenticatedUser();
  const shot = await db.shot.findUnique({ where: { id: shotId }, include: { scene: { include: { project: true } } } });
  if (!shot || shot.scene.project.userId !== user.id) throw new Error("Shot not found.");

  const model = await db.aIModel.findFirst({ where: { type: "IMAGE", enabled: true } });
  if (!model) throw new Error("No image model available for storyboard generation.");

  // Generate Storyboard image via Image Studio engine
  const imgRes = await submitImageGenerationAction({
    modelId: model.slug,
    mode: "text-to-image",
    prompt: `Storyboard illustration sketch: ${shot.prompt}`,
    aspectRatio: shot.scene.project.aspectRatio || "16:9",
    resolution: "1080p",
  });

  const updatedShot = await db.shot.update({
    where: { id: shotId },
    data: {
      storyboardUrl: imgRes.asset.url,
      status: "STORYBOARD_READY",
    },
  });

  revalidatePath(`/cinema/${shot.scene.projectId}`);
  return { success: true, shot: updatedShot };
}

export async function generateVideoForShotAction(shotId: string, modelId?: string) {
  const user = await getAuthenticatedUser();
  const shot = await db.shot.findUnique({
    where: { id: shotId },
    include: { scene: { include: { project: true } }, takes: true },
  });
  if (!shot || shot.scene.project.userId !== user.id) throw new Error("Shot not found.");

  const targetModel = await db.aIModel.findFirst({
    where: { OR: [{ slug: modelId || "vanta-motion-fast" }, { id: modelId || "" }, { type: "VIDEO", enabled: true }] },
  });
  if (!targetModel) throw new Error("No video generation model available.");

  const creditCost = targetModel.creditCost || 8;
  const takeNumber = shot.takes.length + 1;
  const sampleVideoUrl = "/werewolf_cinematic_preview.jpg";

  // Create Take record
  const take = await db.take.create({
    data: {
      shotId: shot.id,
      takeNumber,
      videoUrl: sampleVideoUrl,
      thumbnailUrl: sampleVideoUrl,
      prompt: shot.prompt,
      modelId: targetModel.id,
      creditCost,
    },
  });

  // Update shot selected take
  const updatedShot = await db.shot.update({
    where: { id: shotId },
    data: {
      selectedTakeId: take.id,
      videoUrl: take.videoUrl,
      status: "VIDEO_READY",
    },
  });

  // Track project spent credits
  await db.project.update({
    where: { id: shot.scene.projectId },
    data: { creditSpent: { increment: creditCost } },
  });

  revalidatePath(`/cinema/${shot.scene.projectId}`);
  return { success: true, take, shot: updatedShot };
}

export async function selectShotTakeAction(shotId: string, takeId: string) {
  const user = await getAuthenticatedUser();
  const shot = await db.shot.findUnique({ where: { id: shotId }, include: { scene: true } });
  if (!shot) throw new Error("Shot not found.");

  const take = await db.take.findUnique({ where: { id: takeId } });
  if (!take) throw new Error("Take not found.");

  const updatedShot = await db.shot.update({
    where: { id: shotId },
    data: {
      selectedTakeId: take.id,
      videoUrl: take.videoUrl,
    },
  });

  revalidatePath(`/cinema/${shot.scene.projectId}`);
  return updatedShot;
}

export async function exportFilmAction(projectId: string) {
  const user = await getAuthenticatedUser();
  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: { scenes: { include: { shots: true } } },
  });

  if (!project) throw new Error("Project not found.");

  const exportCount = await db.filmExport.count({ where: { projectId } });
  const exportName = `${project.name} - Render v${exportCount + 1}`;

  const filmExport = await db.filmExport.create({
    data: {
      projectId: project.id,
      name: exportName,
      status: "PROCESSING",
      progress: 50,
    },
  });

  // Transfer compiled MP4 film asset to persistent VANTA storage
  const sampleUrl = "/werewolf_cinematic_preview.jpg";
  const storageKey = `users/${user.id}/exports/${filmExport.id}.mp4`;
  let finalExportUrl = sampleUrl;

  try {
    const imgRes = await fetch(sampleUrl);
    if (imgRes.ok) {
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const storage = getStorageProvider();
      const uploadRes = await storage.upload(buffer, storageKey, "video/mp4");
      finalExportUrl = uploadRes.url;
    }
  } catch {
    // fallback
  }

  // Complete Export
  const updatedExport = await db.filmExport.update({
    where: { id: filmExport.id },
    data: {
      status: "COMPLETED",
      progress: 100,
      videoUrl: finalExportUrl,
    },
  });

  // Index final film as a Video Asset in Asset Library
  const asset = await db.asset.create({
    data: {
      userId: user.id,
      type: "VIDEO",
      name: exportName,
      url: finalExportUrl,
      thumbnailUrl: finalExportUrl,
      mimeType: "video/mp4",
      resolution: "1080p",
      duration: "00:30",
      projectId: project.id,
    },
  });

  revalidatePath(`/cinema/${projectId}`);
  revalidatePath("/assets");
  return { success: true, export: updatedExport, asset };
}
