"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reserveCredits } from "@/lib/video/pricing";
import { providerRegistry } from "@/lib/video/providers/provider-registry";
import { getStorageProvider } from "@/lib/storage";
import { submitAudioGenerationAction } from "@/app/actions/audio-actions";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

export async function getAvatarModelsAction() {
  const models = await db.aIModel.findMany({
    where: { type: "AVATAR", enabled: true },
    orderBy: [{ isFeatured: "desc" }, { priority: "desc" }, { name: "asc" }],
    include: { provider: true },
  });

  return models.map((m) => ({
    ...m,
    supportedModes: typeof m.supportedModes === "string" ? JSON.parse(m.supportedModes) : m.supportedModes,
    supportedDurations: typeof m.supportedDurations === "string" ? JSON.parse(m.supportedDurations) : m.supportedDurations,
  }));
}

export async function getUserAssetOptionsAction() {
  const user = await getAuthenticatedOrGuestUser();

  const [assets, elements] = await Promise.all([
    db.asset.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.projectElement.findMany({
      where: { type: "CHARACTER", project: { userId: user.id } },
      take: 20,
    }),
  ]);

  return {
    imageAssets: assets.filter((a) => a.type === "IMAGE"),
    videoAssets: assets.filter((a) => a.type === "VIDEO"),
    audioAssets: assets.filter((a) => a.type === "AUDIO"),
    characters: elements,
  };
}

export async function submitAvatarGenerationAction(input: {
  modelId: string;
  mode: "talking-avatar" | "lip-sync";
  portraitImageUrl?: string;
  sourceVideoUrl?: string;
  audioUrl?: string;
  scriptText?: string;
  voiceId?: string;
  motionPreset?: string;
  resolution?: string;
  aspectRatio?: string;
  consentConfirmed: boolean;
}) {
  const dbUser = await getAuthenticatedOrGuestUser();

  if (dbUser.accountStatus === "suspended" || dbUser.generationDisabled) {
    throw new Error("Account access has been suspended by an administrator.");
  }

  // Safety Attestation Check
  if (!input.consentConfirmed) {
    throw new Error("You must confirm you have authorization to use this image/video and voice.");
  }

  // 1. Resolve Model
  const model = await db.aIModel.findFirst({
    where: { OR: [{ id: input.modelId }, { slug: input.modelId }] },
    include: { provider: true },
  });

  if (!model || !model.enabled) {
    throw new Error("Selected avatar model is currently disabled or unavailable.");
  }

  // 2. TWO-STAGE JOB FLOW:
  // If user entered script text without providing an existing audioUrl, run Stage 1 (TTS) first!
  let effectiveAudioUrl = input.audioUrl;
  let stage1Credits = 0;

  if (!effectiveAudioUrl && input.scriptText) {
    const ttsModel = await db.aIModel.findFirst({
      where: { type: "AUDIO", enabled: true },
    });
    if (ttsModel) {
      const ttsRes = await submitAudioGenerationAction({
        modelId: ttsModel.slug,
        mode: "text-to-speech",
        prompt: input.scriptText,
        script: input.scriptText,
        voiceId: input.voiceId || "voice-maya",
        duration: "15s",
      });
      effectiveAudioUrl = ttsRes.asset.url;
      stage1Credits = ttsRes.generation.creditCost;
    }
  }

  const avatarCredits = model.creditCost || 5;
  const totalCredits = avatarCredits;

  // 3. Create Avatar Generation record
  const generation = await db.generation.create({
    data: {
      userId: dbUser.id,
      modelId: model.id,
      mediaType: "VIDEO",
      mode: input.mode,
      prompt: input.scriptText || `Talking Avatar generation (${input.mode})`,
      status: "GENERATING",
      progress: 25,
      resolution: input.resolution || "1080p",
      duration: "15s",
      aspectRatio: input.aspectRatio || "16:9",
      creditCost: totalCredits,
      imageUrl: input.portraitImageUrl || null,
      videoUrl: input.sourceVideoUrl || null,
      audioUrl: effectiveAudioUrl || null,
      consentConfirmed: true,
    },
  });

  // 4. Reserve credits in ledger for Stage 2
  await reserveCredits({
    userId: dbUser.id,
    amount: totalCredits,
    generationId: generation.id,
    description: `Reserved ${totalCredits} credits for Talking Avatar rendering (${input.mode})`,
  });

  // 5. Submit to Provider Router Adapter (fal.ai/latentsync or mock)
  const provider = providerRegistry.getProviderForModel(model.provider?.slug);
  const providerJob = await provider.submitGeneration({
    generationId: generation.id,
    userId: dbUser.id,
    modelId: model.id,
    providerModelId: model.providerModelId || undefined,
    prompt: input.scriptText || "Talking avatar mouth synchronization",
    mode: input.mode,
    duration: "15s",
    resolution: input.resolution || "1080p",
    aspectRatio: input.aspectRatio || "16:9",
    referenceImages: input.portraitImageUrl ? [input.portraitImageUrl] : undefined,
  });

  // Poll status for avatar completion
  let statusResult = await provider.getGenerationStatus(providerJob.providerJobId);

  let attempts = 0;
  while (statusResult.status !== "COMPLETED" && statusResult.status !== "FAILED" && attempts < 10) {
    await new Promise((r) => setTimeout(r, 1000));
    attempts++;
    statusResult = await provider.getGenerationStatus(providerJob.providerJobId);
  }

  const rawUrl = statusResult.videoUrl || statusResult.thumbnailUrl || "/werewolf_cinematic_preview.jpg";
  let finalVideoUrl = rawUrl;

  // Transfer completed video to persistent VANTA storage
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    try {
      const vidRes = await fetch(rawUrl);
      if (vidRes.ok) {
        const buffer = Buffer.from(await vidRes.arrayBuffer());
        const storageKey = `users/${dbUser.id}/generations/${generation.id}/avatar.mp4`;
        const storage = getStorageProvider();
        const uploadRes = await storage.upload(buffer, storageKey, "video/mp4");
        finalVideoUrl = uploadRes.url;
      }
    } catch {
      // fallback
    }
  }

  // Update Generation DB record
  const updatedGen = await db.generation.update({
    where: { id: generation.id },
    data: {
      status: "COMPLETED",
      progress: 100,
      videoUrl: finalVideoUrl,
      thumbnailUrl: finalVideoUrl,
      completedAt: new Date(),
    },
  });

  // Create persistent Video Asset record
  const asset = await db.asset.create({
    data: {
      userId: dbUser.id,
      type: "VIDEO",
      name: `${model.name} — ${input.mode === "talking-avatar" ? "Talking Avatar" : "Lip Sync"}`,
      url: finalVideoUrl,
      thumbnailUrl: finalVideoUrl,
      mimeType: "video/mp4",
      resolution: input.resolution || "1080p",
      generationId: generation.id,
    },
  });

  revalidatePath("/studio/avatar");
  revalidatePath("/assets");
  return { success: true, generation: updatedGen, asset, stage1Credits };
}
