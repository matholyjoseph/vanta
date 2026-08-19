import { db } from "@/lib/db";
import { directorPlanner, BuildPlanInput } from "@/lib/director/director-planner";
import { checkDirectorRunBudget } from "@/lib/director/director-budget-manager";
import { directorExecutor } from "@/lib/director/director-executor";
import { directorEventService } from "@/lib/director/director-event-service";
import { DirectorPlan } from "@/lib/director/director-types";

export class DirectorService {
  public async createDirectorRun(userId: string, input: BuildPlanInput) {
    // 1. Create DirectorRun DB record
    const run = await db.directorRun.create({
      data: {
        userId,
        originalPrompt: input.prompt,
        template: input.template || null,
        targetDestination: input.destination || "GENERIC",
        automationLevel: input.template === "plan-only" ? "PLAN_ONLY" : "PLAN_AND_GENERATE",
        qualityPreference: input.qualityPreference || "BALANCED",
        budgetPreference: input.budgetPreference || "ASK",
        creditBudget: input.creditBudget || 500,
        status: "PLANNING",
        currentStage: "UNDERSTANDING_REQUEST",
        progress: 10,
      },
    });

    await directorEventService.emitEvent({
      directorRunId: run.id,
      stage: "UNDERSTANDING_REQUEST",
      type: "INFO",
      message: `Analyzing natural language instruction: "${input.prompt}"`,
    });

    // 2. Generate Structured Director Plan
    const plan = await directorPlanner.planProduction({
      ...input,
      creditBudget: run.creditBudget,
    });

    // 3. Perform Budget Safeguard Check
    const budgetCheck = await checkDirectorRunBudget({
      userId,
      estimatedCredits: plan.estimatedCredits,
      creditBudget: run.creditBudget,
      budgetPreference: run.budgetPreference,
    });

    const isPlanOnly = run.automationLevel === "PLAN_ONLY";
    const initialStatus = isPlanOnly
      ? "COMPLETED"
      : budgetCheck.approved
      ? "AWAITING_APPROVAL"
      : "NEEDS_APPROVAL";

    const updatedRun = await db.directorRun.update({
      where: { id: run.id },
      data: {
        creativeBrief: JSON.stringify(plan.creativeBrief),
        planJson: JSON.stringify(plan),
        estimatedCredits: plan.estimatedCredits,
        status: initialStatus,
        currentStage: "AWAITING_APPROVAL",
        progress: 25,
      },
    });

    // 4. Build Task Graph DAG
    await directorExecutor.buildTaskGraph(run.id, plan);

    await directorEventService.emitEvent({
      directorRunId: run.id,
      stage: "AWAITING_APPROVAL",
      type: "CHECKPOINT",
      message: `Production plan generated. Estimated cost: ${plan.estimatedCredits} credits (${plan.scenes.reduce((sum, sc) => sum + sc.shots.length, 0)} shots). Awaiting user approval.`,
      data: { estimatedCredits: plan.estimatedCredits, plan },
    });

    return updatedRun;
  }

  public async approveAndProduceRun(directorRunId: string, userId: string) {
    const run = await db.directorRun.findUnique({ where: { id: directorRunId } });
    if (!run || run.userId !== userId) throw new Error("Director run not found or access denied.");

    // Update status to EXECUTING
    const updated = await db.directorRun.update({
      where: { id: directorRunId },
      data: {
        status: "EXECUTING",
        currentStage: "CREATING_REFERENCES",
        startedAt: new Date(),
      },
    });

    await directorEventService.emitEvent({
      directorRunId,
      stage: "EXECUTING",
      type: "INFO",
      message: "Plan approved! Starting automated media generation and Cinema timeline assembly.",
    });

    // Execute first batch of task DAG
    await directorExecutor.executeNextTasks(directorRunId, userId);

    return updated;
  }

  public async processMidRunInstruction(directorRunId: string, userId: string, instruction: string) {
    const run = await db.directorRun.findUnique({ where: { id: directorRunId } });
    if (!run || run.userId !== userId) throw new Error("Director run not found.");

    await directorEventService.emitEvent({
      directorRunId,
      stage: "MID_RUN_REVISION",
      type: "INFO",
      message: `Processing mid-run revision instruction: "${instruction}"`,
    });

    // Invalidate affected dependencies
    if (instruction.toLowerCase().includes("male") || instruction.toLowerCase().includes("voice") || instruction.toLowerCase().includes("narrator")) {
      await db.directorTask.updateMany({
        where: { directorRunId, type: { in: ["GENERATE_VOICE", "EXPORT_FILM"] } },
        data: { status: "PENDING" },
      });
      await directorEventService.emitEvent({
        directorRunId,
        stage: "MID_RUN_REVISION",
        type: "SUCCESS",
        message: "Voiceover audio invalidated and re-queued. Existing video shots and storyboards preserved.",
      });
    } else if (instruction.toLowerCase().includes("cheaper") || instruction.toLowerCase().includes("economy")) {
      await db.directorRun.update({
        where: { id: directorRunId },
        data: { qualityPreference: "ECONOMY" },
      });
      await directorEventService.emitEvent({
        directorRunId,
        stage: "MID_RUN_REVISION",
        type: "SUCCESS",
        message: "Quality preference updated to ECONOMY models.",
      });
    }

    if (run.status === "EXECUTING") {
      await directorExecutor.executeNextTasks(directorRunId, userId);
    }

    return db.directorRun.findUnique({ where: { id: directorRunId } });
  }

  public async pauseRun(directorRunId: string, userId: string) {
    const run = await db.directorRun.findUnique({ where: { id: directorRunId } });
    if (!run || run.userId !== userId) throw new Error("Director run not found.");

    const updated = await db.directorRun.update({
      where: { id: directorRunId },
      data: { status: "PAUSED" },
    });

    await directorEventService.emitEvent({
      directorRunId,
      stage: "PAUSED",
      type: "WARNING",
      message: "Director run paused by user. Launching new tasks suspended.",
    });

    return updated;
  }

  public async resumeRun(directorRunId: string, userId: string) {
    const run = await db.directorRun.findUnique({ where: { id: directorRunId } });
    if (!run || run.userId !== userId) throw new Error("Director run not found.");

    const updated = await db.directorRun.update({
      where: { id: directorRunId },
      data: { status: "EXECUTING" },
    });

    await directorEventService.emitEvent({
      directorRunId,
      stage: "EXECUTING",
      type: "INFO",
      message: "Director run resumed.",
    });

    await directorExecutor.executeNextTasks(directorRunId, userId);
    return updated;
  }

  public async cancelRun(directorRunId: string, userId: string) {
    const run = await db.directorRun.findUnique({ where: { id: directorRunId } });
    if (!run || run.userId !== userId) throw new Error("Director run not found.");

    const updated = await db.directorRun.update({
      where: { id: directorRunId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await db.directorTask.updateMany({
      where: { directorRunId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });

    await directorEventService.emitEvent({
      directorRunId,
      stage: "CANCELLED",
      type: "WARNING",
      message: "Director run cancelled by user.",
    });

    return updated;
  }
}

export const directorService = new DirectorService();
