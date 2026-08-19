"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { scriptBreakdownService } from "@/lib/services/script-breakdown";
import { exportFilmService } from "@/lib/services/export-film";
import { getAuthenticatedOrGuestUserId } from "@/lib/guest-auth";

async function getAuthenticatedUserId(): Promise<string> {
  return getAuthenticatedOrGuestUserId();
}

export async function getProjectsAction(searchQuery?: string, sortBy: "updatedAt" | "name" = "updatedAt") {
  const userId = await getAuthenticatedUserId();

  const where: Record<string, unknown> = { userId };
  if (searchQuery && searchQuery.trim().length > 0) {
    where.OR = [
      { name: { contains: searchQuery.trim(), mode: "insensitive" } },
      { description: { contains: searchQuery.trim(), mode: "insensitive" } },
    ];
  }

  const orderBy = sortBy === "name" ? { name: "asc" as const } : { updatedAt: "desc" as const };

  const projects = await db.project.findMany({
    where,
    orderBy,
    include: {
      scenes: {
        select: { id: true },
      },
    },
  });

  return projects;
}

export async function createProjectAction(name: string, description?: string) {
  const userId = await getAuthenticatedUserId();

  const project = await db.project.create({
    data: {
      userId,
      name: name.trim() || "Untitled Project",
      description: description?.trim() || null,
      sceneCount: 1,
      status: "active",
      scenes: {
        create: {
          title: "Scene 01",
          order: 0,
          shots: {
            create: [
              {
                shotNumber: "Shot 1.1",
                prompt: "Establishing wide shot of scene atmosphere.",
                duration: "00:04",
                order: 0,
              },
            ],
          },
        },
      },
      elements: {
        create: [
          {
            name: "Maya",
            type: "CHARACTER",
            description: "Lead protagonist with dark jacket and glowing cybernetic eye",
          },
          {
            name: "Penthouse",
            type: "LOCATION",
            description: "High-tech luxury penthouse overlooking metropolis skyline",
          },
        ],
      },
    },
    include: {
      scenes: {
        include: { shots: true },
      },
      elements: true,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return project;
}

export async function renameProjectAction(projectId: string, name: string) {
  const userId = await getAuthenticatedUserId();

  const project = await db.project.update({
    where: { id: projectId, userId },
    data: { name: name.trim() },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return project;
}

export async function duplicateProjectAction(projectId: string) {
  const userId = await getAuthenticatedUserId();

  const existing = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      scenes: {
        include: { shots: true },
      },
      elements: true,
    },
  });

  if (!existing) {
    throw new Error("Project not found or access denied.");
  }

  const duplicated = await db.project.create({
    data: {
      userId,
      name: `${existing.name} (Copy)`,
      description: existing.description,
      status: existing.status,
      sceneCount: existing.sceneCount,
      scenes: {
        create: existing.scenes.map((s) => ({
          title: s.title,
          description: s.description,
          order: s.order,
          shots: {
            create: s.shots.map((sh) => ({
              shotNumber: sh.shotNumber,
              prompt: sh.prompt,
              duration: sh.duration,
              status: sh.status,
              videoUrl: sh.videoUrl,
              order: sh.order,
            })),
          },
        })),
      },
      elements: {
        create: existing.elements.map((e) => ({
          name: e.name,
          type: e.type,
          description: e.description,
          prompt: e.prompt,
        })),
      },
    },
  });

  revalidatePath("/projects");
  return duplicated;
}

export async function deleteProjectAction(projectId: string) {
  const userId = await getAuthenticatedUserId();

  await db.project.delete({
    where: { id: projectId, userId },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getProjectDetailAction(projectId: string) {
  const userId = await getAuthenticatedUserId();

  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      scenes: {
        orderBy: { order: "asc" },
        include: {
          shots: {
            orderBy: { order: "asc" },
          },
        },
      },
      elements: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found or access denied.");
  }

  return project;
}

export async function createSceneAction(projectId: string, title: string) {
  const userId = await getAuthenticatedUserId();

  // Verify ownership
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: { scenes: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const nextOrder = project.scenes.length;
  const sceneNumber = (nextOrder + 1).toString().padStart(2, "0");

  const scene = await db.scene.create({
    data: {
      projectId,
      title: title.trim() || `Scene ${sceneNumber}`,
      order: nextOrder,
      shots: {
        create: {
          shotNumber: `Shot ${nextOrder + 1}.1`,
          prompt: "Initial shot description",
          duration: "00:04",
          order: 0,
        },
      },
    },
    include: { shots: true },
  });

  await db.project.update({
    where: { id: projectId },
    data: { sceneCount: project.scenes.length + 1, updatedAt: new Date() },
  });

  revalidatePath(`/projects/${projectId}`);
  return scene;
}

export async function renameSceneAction(sceneId: string, title: string) {
  const userId = await getAuthenticatedUserId();

  const scene = await db.scene.findUnique({
    where: { id: sceneId },
    include: { project: true },
  });

  if (!scene || scene.project.userId !== userId) {
    throw new Error("Scene not found or access denied.");
  }

  const updated = await db.scene.update({
    where: { id: sceneId },
    data: { title: title.trim() },
  });

  revalidatePath(`/projects/${scene.projectId}`);
  return updated;
}

export async function deleteSceneAction(sceneId: string) {
  const userId = await getAuthenticatedUserId();

  const scene = await db.scene.findUnique({
    where: { id: sceneId },
    include: { project: true },
  });

  if (!scene || scene.project.userId !== userId) {
    throw new Error("Scene not found or access denied.");
  }

  await db.scene.delete({ where: { id: sceneId } });

  revalidatePath(`/projects/${scene.projectId}`);
  return { success: true };
}

export async function reorderScenesAction(projectId: string, sceneIds: string[]) {
  const userId = await getAuthenticatedUserId();

  const project = await db.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) {
    throw new Error("Project access denied.");
  }

  const updates = sceneIds.map((id, index) =>
    db.scene.update({
      where: { id },
      data: { order: index },
    })
  );

  await db.$transaction(updates);
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function createShotAction(sceneId: string, prompt: string, shotNumber?: string) {
  const userId = await getAuthenticatedUserId();

  const scene = await db.scene.findUnique({
    where: { id: sceneId },
    include: { project: true, shots: true },
  });

  if (!scene || scene.project.userId !== userId) {
    throw new Error("Scene not found.");
  }

  const nextOrder = scene.shots.length;
  const defaultShotNum = `Shot ${scene.order + 1}.${nextOrder + 1}`;

  const shot = await db.shot.create({
    data: {
      sceneId,
      shotNumber: shotNumber || defaultShotNum,
      prompt: prompt.trim() || "New shot prompt description",
      duration: "00:04",
      order: nextOrder,
      status: "IDLE",
    },
  });

  revalidatePath(`/projects/${scene.projectId}`);
  return shot;
}

export async function updateShotAction(
  shotId: string,
  data: { prompt?: string; duration?: string; status?: string; videoUrl?: string }
) {
  const userId = await getAuthenticatedUserId();

  const shot = await db.shot.findUnique({
    where: { id: shotId },
    include: { scene: { include: { project: true } } },
  });

  if (!shot || shot.scene.project.userId !== userId) {
    throw new Error("Shot not found.");
  }

  const updated = await db.shot.update({
    where: { id: shotId },
    data: {
      ...(data.prompt !== undefined && { prompt: data.prompt }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
    },
  });

  revalidatePath(`/projects/${shot.scene.projectId}`);
  return updated;
}

export async function deleteShotAction(shotId: string) {
  const userId = await getAuthenticatedUserId();

  const shot = await db.shot.findUnique({
    where: { id: shotId },
    include: { scene: { include: { project: true } } },
  });

  if (!shot || shot.scene.project.userId !== userId) {
    throw new Error("Shot not found.");
  }

  await db.shot.delete({ where: { id: shotId } });

  revalidatePath(`/projects/${shot.scene.projectId}`);
  return { success: true };
}

export async function createProjectElementAction(
  projectId: string,
  data: {
    name: string;
    type: "CHARACTER" | "LOCATION" | "PROP" | "STYLE";
    description?: string;
    prompt?: string;
  }
) {
  const userId = await getAuthenticatedUserId();

  const project = await db.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) {
    throw new Error("Project access denied.");
  }

  const element = await db.projectElement.create({
    data: {
      projectId,
      name: data.name.trim().replace(/^@/, ""),
      type: data.type,
      description: data.description?.trim() || null,
      prompt: data.prompt?.trim() || null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return element;
}

export async function deleteProjectElementAction(elementId: string) {
  const userId = await getAuthenticatedUserId();

  const el = await db.projectElement.findUnique({
    where: { id: elementId },
    include: { project: true },
  });

  if (!el || el.project.userId !== userId) {
    throw new Error("Element access denied.");
  }

  await db.projectElement.delete({ where: { id: elementId } });
  revalidatePath(`/projects/${el.projectId}`);
  return { success: true };
}

export async function breakdownScriptAction(scriptText: string) {
  return await scriptBreakdownService.breakdownScript(scriptText);
}

export async function applyScriptBreakdownAction(projectId: string, scriptText: string) {
  const userId = await getAuthenticatedUserId();

  const project = await db.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const proposedScenes = await scriptBreakdownService.breakdownScript(scriptText);

  // Clear current scenes and replace with approved script breakdown
  await db.scene.deleteMany({ where: { projectId } });

  for (let i = 0; i < proposedScenes.length; i++) {
    const ps = proposedScenes[i];
    await db.scene.create({
      data: {
        projectId,
        title: ps.title,
        description: ps.description,
        order: i,
        shots: {
          create: ps.shots.map((sh, idx) => ({
            shotNumber: sh.shotNumber,
            prompt: sh.prompt,
            duration: sh.duration,
            order: idx,
          })),
        },
      },
    });
  }

  await db.project.update({
    where: { id: projectId },
    data: { sceneCount: proposedScenes.length, updatedAt: new Date() },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function exportFilmAction(projectId: string) {
  const userId = await getAuthenticatedUserId();
  return await exportFilmService.exportProjectFilm(projectId, userId);
}
