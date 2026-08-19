import { db } from "@/lib/db";
import { DirectorPlan } from "@/lib/director/director-types";
import { directorToolRegistry } from "@/lib/director/director-tool-registry";
import { directorEventService } from "@/lib/director/director-event-service";
import { directorRepairService } from "@/lib/director/director-repair-service";

export class DirectorExecutorService {
  public async buildTaskGraph(directorRunId: string, plan: DirectorPlan): Promise<void> {
    // Delete previous pending tasks if rebuilding
    await db.directorTask.deleteMany({ where: { directorRunId, status: "PENDING" } });

    // Task 1: Create Cinema Project
    const projTask = await db.directorTask.create({
      data: {
        directorRunId,
        type: "CREATE_PROJECT",
        status: "READY",
        input: JSON.stringify({
          name: plan.title,
          aspectRatio: plan.creativeBrief.aspectRatio,
          creditBudget: plan.estimatedCredits + 200,
        }),
        estimatedCredits: 0,
      },
    });

    // Task 2: References Generation (Characters & Locations)
    const refTask = await db.directorTask.create({
      data: {
        directorRunId,
        parentTaskId: projTask.id,
        type: "GENERATE_REFERENCE",
        status: "PENDING",
        dependencies: JSON.stringify([projTask.id]),
        input: JSON.stringify({
          prompt: plan.characters[0]?.prompt || "Lead character cinematic portrait",
          modelId: plan.modelAssignments.imageModel,
          aspectRatio: plan.creativeBrief.aspectRatio,
        }),
        estimatedCredits: 3,
      },
    });

    // Tasks for Storyboards & Video Shots
    const videoTaskIds: string[] = [];

    for (const scene of plan.scenes) {
      for (const shot of scene.shots) {
        // Storyboard Task
        const sbTask = await db.directorTask.create({
          data: {
            directorRunId,
            parentTaskId: refTask.id,
            type: "GENERATE_STORYBOARD",
            status: "PENDING",
            dependencies: JSON.stringify([refTask.id]),
            input: JSON.stringify({
              prompt: shot.storyboardPrompt,
              modelId: plan.modelAssignments.imageModel,
              aspectRatio: plan.creativeBrief.aspectRatio,
            }),
            estimatedCredits: 3,
          },
        });

        // Video Task
        const vidTask = await db.directorTask.create({
          data: {
            directorRunId,
            parentTaskId: sbTask.id,
            type: "GENERATE_VIDEO",
            status: "PENDING",
            dependencies: JSON.stringify([sbTask.id]),
            input: JSON.stringify({
              prompt: shot.prompt,
              modelId: plan.modelAssignments.videoModel,
              aspectRatio: plan.creativeBrief.aspectRatio,
              duration: shot.duration,
            }),
            estimatedCredits: 8,
          },
        });

        videoTaskIds.push(vidTask.id);
      }
    }

    // Audio Tasks (Voiceover & Music)
    const voiceTask = await db.directorTask.create({
      data: {
        directorRunId,
        parentTaskId: projTask.id,
        type: "GENERATE_VOICE",
        status: "PENDING",
        dependencies: JSON.stringify([projTask.id]),
        input: JSON.stringify({
          script: plan.voiceoverScript || plan.scriptText,
          modelId: plan.modelAssignments.audioModel,
          voiceId: plan.voiceId,
        }),
        estimatedCredits: 3,
      },
    });

    const musicTask = await db.directorTask.create({
      data: {
        directorRunId,
        parentTaskId: projTask.id,
        type: "GENERATE_MUSIC",
        status: "PENDING",
        dependencies: JSON.stringify([projTask.id]),
        input: JSON.stringify({
          prompt: plan.musicPrompt,
          modelId: plan.modelAssignments.audioModel,
          duration: `${plan.totalDurationSeconds}s`,
        }),
        estimatedCredits: 3,
      },
    });

    // Assembly Task (Depends on all videos, voice, music)
    const allMediaTaskIds = [...videoTaskIds, voiceTask.id, musicTask.id];
    const assembleTask = await db.directorTask.create({
      data: {
        directorRunId,
        type: "ASSEMBLE_TIMELINE",
        status: "PENDING",
        dependencies: JSON.stringify(allMediaTaskIds),
        input: JSON.stringify({ title: plan.title }),
        estimatedCredits: 0,
      },
    });

    // Export Film Task
    await db.directorTask.create({
      data: {
        directorRunId,
        parentTaskId: assembleTask.id,
        type: "EXPORT_FILM",
        status: "PENDING",
        dependencies: JSON.stringify([assembleTask.id]),
        input: JSON.stringify({ title: plan.title }),
        estimatedCredits: 5,
      },
    });
  }

  public async executeNextTasks(directorRunId: string, userId: string): Promise<void> {
    const run = await db.directorRun.findUnique({
      where: { id: directorRunId },
      include: { tasks: true },
    });

    if (!run || run.status !== "EXECUTING") return;

    // Resolve tasks ready for execution
    const completedTaskIds = new Set(
      run.tasks.filter((t) => t.status === "COMPLETED" || t.status === "SKIPPED").map((t) => t.id)
    );

    const readyTasks = run.tasks.filter((t) => {
      if (t.status !== "PENDING" && t.status !== "READY") return false;
      const deps: string[] = typeof t.dependencies === "string" ? JSON.parse(t.dependencies) : t.dependencies || [];
      return deps.every((depId) => completedTaskIds.has(depId));
    });

    if (readyTasks.length === 0) {
      const allDone = run.tasks.every(
        (t) => t.status === "COMPLETED" || t.status === "SKIPPED" || t.status === "FAILED"
      );

      if (allDone) {
        await directorRepairService.performQualityCheck(directorRunId);
        await db.directorRun.update({
          where: { id: directorRunId },
          data: {
            status: "COMPLETED",
            currentStage: "COMPLETED",
            progress: 100,
            completedAt: new Date(),
          },
        });

        await directorEventService.emitEvent({
          directorRunId,
          stage: "COMPLETED",
          type: "SUCCESS",
          message: "AI Director production successfully completed! All assets and film timeline are ready.",
        });
      }
      return;
    }

    // Process ready tasks
    for (const task of readyTasks) {
      await db.directorTask.update({
        where: { id: task.id },
        data: { status: "RUNNING", startedAt: new Date() },
      });

      const tool = directorToolRegistry.getTool(
        task.type === "CREATE_PROJECT"
          ? "createProject"
          : task.type === "GENERATE_REFERENCE"
          ? "generateImage"
          : task.type === "GENERATE_STORYBOARD"
          ? "generateImage"
          : task.type === "GENERATE_VIDEO"
          ? "generateVideo"
          : task.type === "GENERATE_VOICE"
          ? "generateVoice"
          : task.type === "GENERATE_MUSIC"
          ? "generateMusic"
          : task.type === "EXPORT_FILM"
          ? "exportFilm"
          : "createProject"
      );

      try {
        const inputData = typeof task.input === "string" ? JSON.parse(task.input) : task.input;
        const result = tool ? await tool.execute(inputData, { userId, runId: directorRunId, projectId: run.projectId || undefined }) : { success: true };

        // If project creation, link project ID to DirectorRun
        if (task.type === "CREATE_PROJECT" && result?.id) {
          await db.directorRun.update({
            where: { id: directorRunId },
            data: { projectId: result.id },
          });
        }

        await db.directorTask.update({
          where: { id: task.id },
          data: {
            status: "COMPLETED",
            output: JSON.stringify(result),
            actualCredits: task.estimatedCredits,
            completedAt: new Date(),
          },
        });

        await db.directorRun.update({
          where: { id: directorRunId },
          data: {
            actualCredits: { increment: task.estimatedCredits },
          },
        });

        await directorEventService.emitEvent({
          directorRunId,
          stage: task.type,
          type: "SUCCESS",
          message: `Task ${task.type} completed successfully.`,
        });
      } catch (err: any) {
        await db.directorTask.update({
          where: { id: task.id },
          data: {
            status: "FAILED",
            error: err?.message || "Task execution failed.",
          },
        });

        await directorEventService.emitEvent({
          directorRunId,
          stage: task.type,
          type: "ERROR",
          message: `Task ${task.type} failed: ${err?.message || "Execution error"}`,
        });
      }
    }

    // Update overall progress percentage
    const updatedRun = await db.directorRun.findUnique({
      where: { id: directorRunId },
      include: { tasks: true },
    });

    if (updatedRun && updatedRun.tasks.length > 0) {
      const completedCount = updatedRun.tasks.filter((t) => t.status === "COMPLETED" || t.status === "SKIPPED").length;
      const pct = Math.round((completedCount / updatedRun.tasks.length) * 100);

      await db.directorRun.update({
        where: { id: directorRunId },
        data: { progress: pct },
      });
    }
  }
}

export const directorExecutor = new DirectorExecutorService();
