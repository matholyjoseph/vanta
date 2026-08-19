"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { directorService } from "@/lib/director/director-service";
import { directorEventService } from "@/lib/director/director-event-service";
import { directorPlanner } from "@/lib/director/director-planner";

export async function createDirectorRunAction(params: {
  prompt: string;
  template?: string;
  destination?: string;
  duration?: string;
  aspectRatio?: string;
  qualityPreference?: "ECONOMY" | "BALANCED" | "PREMIUM";
  budgetPreference?: "USE_AVAILABLE" | "MAX_CREDITS" | "ASK";
  creditBudget?: number;
}) {
  const user = await getAuthenticatedOrGuestUser();

  const run = await directorService.createDirectorRun(user.id, {
    prompt: params.prompt,
    template: params.template,
    destination: params.destination,
    duration: params.duration,
    aspectRatio: params.aspectRatio,
    qualityPreference: params.qualityPreference,
    budgetPreference: params.budgetPreference,
    creditBudget: params.creditBudget,
  });

  revalidatePath("/director");
  return run;
}

export async function getDirectorRunDetailsAction(directorRunId: string) {
  const user = await getAuthenticatedOrGuestUser();

  const run = await db.directorRun.findFirst({
    where: { id: directorRunId, userId: user.id },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "desc" }, take: 40 },
    },
  });

  if (!run) throw new Error("Director Run not found.");

  let project = null;
  if (run.projectId) {
    project = await db.project.findFirst({
      where: { id: run.projectId },
      include: { scenes: { include: { shots: true } }, exports: true },
    });
  }

  return {
    ...run,
    creativeBrief: run.creativeBrief ? JSON.parse(run.creativeBrief) : null,
    planJson: run.planJson ? JSON.parse(run.planJson) : null,
    project,
  };
}

export async function getDirectorHistoryAction() {
  const user = await getAuthenticatedOrGuestUser();

  const runs = await db.directorRun.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      tasks: { select: { id: true, status: true } },
    },
    take: 20,
  });

  return runs.map((r) => ({
    ...r,
    creativeBrief: r.creativeBrief ? JSON.parse(r.creativeBrief) : null,
    planJson: r.planJson ? JSON.parse(r.planJson) : null,
  }));
}

export async function approveDirectorPlanAction(directorRunId: string) {
  const user = await getAuthenticatedOrGuestUser();
  const run = await directorService.approveAndProduceRun(directorRunId, user.id);
  revalidatePath(`/director/${directorRunId}`);
  return run;
}

export async function updateDirectorPlanAction(directorRunId: string, updatedPlanJson: any) {
  const user = await getAuthenticatedOrGuestUser();
  const run = await db.directorRun.findUnique({ where: { id: directorRunId } });
  if (!run || run.userId !== user.id) throw new Error("Director Run not found.");

  const updated = await db.directorRun.update({
    where: { id: directorRunId },
    data: {
      planJson: JSON.stringify(updatedPlanJson),
      estimatedCredits: updatedPlanJson.estimatedCredits || run.estimatedCredits,
    },
  });

  await directorEventService.emitEvent({
    directorRunId,
    stage: "PLAN_UPDATED",
    type: "SUCCESS",
    message: "Production plan updated manually by user.",
  });

  revalidatePath(`/director/${directorRunId}`);
  return updated;
}

export async function sendDirectorInstructionAction(directorRunId: string, instruction: string) {
  const user = await getAuthenticatedOrGuestUser();
  const run = await directorService.processMidRunInstruction(directorRunId, user.id, instruction);
  revalidatePath(`/director/${directorRunId}`);
  return run;
}

export async function pauseDirectorRunAction(directorRunId: string) {
  const user = await getAuthenticatedOrGuestUser();
  const run = await directorService.pauseRun(directorRunId, user.id);
  revalidatePath(`/director/${directorRunId}`);
  return run;
}

export async function resumeDirectorRunAction(directorRunId: string) {
  const user = await getAuthenticatedOrGuestUser();
  const run = await directorService.resumeRun(directorRunId, user.id);
  revalidatePath(`/director/${directorRunId}`);
  return run;
}

export async function cancelDirectorRunAction(directorRunId: string) {
  const user = await getAuthenticatedOrGuestUser();
  const run = await directorService.cancelRun(directorRunId, user.id);
  revalidatePath(`/director/${directorRunId}`);
  return run;
}

export async function duplicateDirectorRunAction(directorRunId: string) {
  const user = await getAuthenticatedOrGuestUser();
  const original = await db.directorRun.findFirst({ where: { id: directorRunId, userId: user.id } });
  if (!original) throw new Error("Original run not found.");

  const newRun = await directorService.createDirectorRun(user.id, {
    prompt: `${original.originalPrompt} (Copy)`,
    template: original.template || undefined,
    destination: original.targetDestination,
    qualityPreference: original.qualityPreference as any,
    budgetPreference: original.budgetPreference as any,
    creditBudget: original.creditBudget,
  });

  revalidatePath("/director");
  return newRun;
}
