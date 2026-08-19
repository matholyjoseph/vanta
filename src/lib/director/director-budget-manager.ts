import { db } from "@/lib/db";
import { calculateGenerationCost } from "@/lib/video/pricing";
import { DirectorPlan } from "@/lib/director/director-types";

export interface BudgetEstimateResult {
  estimatedCredits: number;
  breakdown: {
    storyboards: { count: number; cost: number };
    videos: { count: number; cost: number };
    voiceover: { count: number; cost: number };
    music: { count: number; cost: number };
    sfx: { count: number; cost: number };
    exportFilm: { count: number; cost: number };
  };
}

export async function calculatePlanCredits(plan: DirectorPlan): Promise<BudgetEstimateResult> {
  const totalShots = plan.scenes.reduce((sum, sc) => sum + sc.shots.length, 0);

  // Storyboard cost (Image Model)
  const imageModel = await db.aIModel.findFirst({ where: { slug: plan.modelAssignments.imageModel } });
  const imgUnitCost = imageModel?.creditCost || 3;
  const storyboardCost = totalShots * imgUnitCost;

  // Video Shots cost (Video Model)
  const videoModel = await db.aIModel.findFirst({ where: { slug: plan.modelAssignments.videoModel } });
  const videoUnitCost = videoModel?.creditCost || 8;
  const videoCost = totalShots * videoUnitCost;

  // Voiceover cost (TTS / Audio Model)
  const voiceoverCost = plan.voiceoverScript && plan.voiceoverScript.trim().length > 0 ? 3 : 0;

  // Music cost
  const musicCost = plan.musicPrompt ? 3 : 0;

  // SFX cost
  const sfxCount = plan.sfxPrompts?.length || 0;
  const sfxCost = sfxCount * 2;

  // Film export cost
  const exportCost = 5;

  const total = storyboardCost + videoCost + voiceoverCost + musicCost + sfxCost + exportCost;

  return {
    estimatedCredits: total,
    breakdown: {
      storyboards: { count: totalShots, cost: storyboardCost },
      videos: { count: totalShots, cost: videoCost },
      voiceover: { count: plan.voiceoverScript ? 1 : 0, cost: voiceoverCost },
      music: { count: plan.musicPrompt ? 1 : 0, cost: musicCost },
      sfx: { count: sfxCount, cost: sfxCost },
      exportFilm: { count: 1, cost: exportCost },
    },
  };
}

export async function checkDirectorRunBudget(params: {
  userId: string;
  estimatedCredits: number;
  creditBudget: number;
  budgetPreference: string;
}): Promise<{ approved: boolean; reason?: string; requiresUserApproval?: boolean; missingCredits?: number }> {
  const wallet = await db.creditWallet.findUnique({ where: { userId: params.userId } });
  const userBalance = wallet?.balance ?? 0;

  if (params.estimatedCredits > params.creditBudget && params.budgetPreference === "ASK") {
    return {
      approved: false,
      requiresUserApproval: true,
      reason: `Estimated cost (${params.estimatedCredits} credits) exceeds your configured project budget (${params.creditBudget} credits).`,
      missingCredits: params.estimatedCredits - params.creditBudget,
    };
  }

  if (params.estimatedCredits > userBalance) {
    return {
      approved: false,
      requiresUserApproval: true,
      reason: `Insufficient wallet balance. You have ${userBalance} credits, but ${params.estimatedCredits} credits are required.`,
      missingCredits: params.estimatedCredits - userBalance,
    };
  }

  return { approved: true };
}
