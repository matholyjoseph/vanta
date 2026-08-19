"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { calculateGenerationCost, reserveCredits, checkConcurrencyLimit } from "@/lib/video/pricing";
import { enqueueGeneration } from "@/lib/queue";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

const generationInputSchema = z.object({
  modelId: z.string().default("vanta-motion-fast"),
  mode: z.enum([
    "text-to-video",
    "image-to-video",
    "video-to-video",
    "start-end-frame",
    "motion-control",
  ]).default("text-to-video"),
  prompt: z.string().min(3, { message: "Prompt must be at least 3 characters long." }),
  negativePrompt: z.string().optional(),
  resolution: z.string().default("1080p"),
  duration: z.string().default("5s"),
  aspectRatio: z.string().default("16:9"),
  fps: z.number().default(24),
  seed: z.string().optional(),
});

export type GenerationSubmissionInput = z.infer<typeof generationInputSchema>;

export async function submitGenerationAction(input: GenerationSubmissionInput) {
  const user = await getAuthenticatedOrGuestUser();
  const userId = user.id;

  const validated = generationInputSchema.parse(input);

  // Check concurrency limit
  await checkConcurrencyLimit(userId);

  // Calculate credit cost server-side
  const creditCost = await calculateGenerationCost({
    modelId: validated.modelId,
    duration: validated.duration,
    resolution: validated.resolution,
  });

  const modelRecord = await db.aIModel.findFirst({
    where: { OR: [{ id: validated.modelId }, { slug: validated.modelId }] },
  });

  const targetModelId = modelRecord?.id || validated.modelId;

  // Create Generation record
  const generation = await db.generation.create({
    data: {
      userId,
      modelId: targetModelId,
      mode: validated.mode,
      prompt: validated.prompt,
      negativePrompt: validated.negativePrompt || null,
      resolution: validated.resolution,
      duration: validated.duration,
      aspectRatio: validated.aspectRatio,
      fps: validated.fps,
      seed: validated.seed || Math.floor(Math.random() * 1000000000).toString(),
      creditCost,
      status: "QUEUED",
      progress: 0,
    },
  });

  // Reserve credits
  await reserveCredits({
    userId,
    amount: creditCost,
    generationId: generation.id,
    description: `Reserved ${creditCost} credits for video generation`,
  });

  // Enqueue Job
  await enqueueGeneration(generation.id);

  revalidatePath("/dashboard");
  revalidatePath("/studio/video");

  return {
    generation,
    jobId: generation.id,
    creditCost,
  };
}

export async function enhancePromptAction(prompt: string) {
  if (!prompt || prompt.trim().length === 0) {
    return "Cinematic low-angle tracking shot through a neon-lit cyberpunk alleyway, rain-slicked streets reflecting vivid green neon lights. Hyper-realistic 8k resolution, volumetric lighting, photorealistic atmosphere.";
  }

  const cleanPrompt = prompt.trim();
  const enhancementSuffix =
    ", cinematic lighting, highly detailed 8k resolution render, 35mm lens, depth of field, volumetric atmosphere, hyper-realistic, photorealistic masterpiece.";
  return `${cleanPrompt}${enhancementSuffix}`;
}
