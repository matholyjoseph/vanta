import { db } from "@/lib/db";
import { directorEventService } from "@/lib/director/director-event-service";

export interface QualityCheckResult {
  passed: boolean;
  issues: Array<{
    type: "FAILED_TASK" | "MISSING_STORYBOARD" | "MISSING_VIDEO" | "MISSING_AUDIO" | "DURATION_MISMATCH";
    severity: "WARNING" | "ERROR";
    message: string;
    suggestedActions: Array<{
      actionKey: string;
      label: string;
      costEstimate: number;
    }>;
  }>;
}

export class DirectorRepairService {
  public async performQualityCheck(directorRunId: string): Promise<QualityCheckResult> {
    const run = await db.directorRun.findUnique({
      where: { id: directorRunId },
      include: { tasks: true },
    });

    if (!run) throw new Error("DirectorRun not found.");

    const issues: QualityCheckResult["issues"] = [];

    // 1. Check for failed tasks
    const failedTasks = run.tasks.filter((t) => t.status === "FAILED");
    for (const ft of failedTasks) {
      issues.push({
        type: "FAILED_TASK",
        severity: "ERROR",
        message: `Task ${ft.type} failed: ${ft.error || "Provider error"}`,
        suggestedActions: [
          { actionKey: "RETRY_TASK", label: "Retry Task", costEstimate: ft.estimatedCredits },
          { actionKey: "SKIP_TASK", label: "Skip Task", costEstimate: 0 },
        ],
      });
    }

    // 2. Check for missing video takes in attached project
    if (run.projectId) {
      const project = await db.project.findUnique({
        where: { id: run.projectId },
        include: { scenes: { include: { shots: true } } },
      });

      if (project) {
        for (const scene of project.scenes) {
          for (const shot of scene.shots) {
            if (!shot.videoUrl) {
              issues.push({
                type: "MISSING_VIDEO",
                severity: "WARNING",
                message: `Shot ${shot.shotNumber} is missing video render.`,
                suggestedActions: [
                  { actionKey: "GENERATE_SHOT_VIDEO", label: `Generate Video for Shot ${shot.shotNumber}`, costEstimate: 8 },
                  { actionKey: "USE_STORYBOARD_STILL", label: "Use Storyboard Still Image", costEstimate: 0 },
                ],
              });
            }
          }
        }
      }
    }

    const passed = issues.filter((i) => i.severity === "ERROR").length === 0;

    await directorEventService.emitEvent({
      directorRunId,
      stage: "QUALITY_CHECK",
      type: passed ? "SUCCESS" : "WARNING",
      message: passed ? "Quality check completed with zero blocking errors." : `Quality check identified ${issues.length} issue(s).`,
      data: { issuesCount: issues.length, passed },
    });

    return { passed, issues };
  }
}

export const directorRepairService = new DirectorRepairService();
