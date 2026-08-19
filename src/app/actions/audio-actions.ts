"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reserveCredits } from "@/lib/video/pricing";
import { providerRegistry } from "@/lib/video/providers/provider-registry";
import { getStorageProvider } from "@/lib/storage";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

export async function getAudioModelsAction() {
  const models = await db.aIModel.findMany({
    where: { type: "AUDIO", enabled: true },
    orderBy: [{ isFeatured: "desc" }, { priority: "desc" }, { name: "asc" }],
    include: { provider: true },
  });

  return models.map((m) => ({
    ...m,
    supportedModes: typeof m.supportedModes === "string" ? JSON.parse(m.supportedModes) : m.supportedModes,
    supportedDurations: typeof m.supportedDurations === "string" ? JSON.parse(m.supportedDurations) : m.supportedDurations,
  }));
}

export async function submitAudioGenerationAction(input: {
  modelId: string;
  mode: string; // "text-to-speech" | "voiceover" | "sound-effects" | "music" | "audio-enhancement" | "transcription"
  prompt: string;
  script?: string;
  voiceId?: string;
  language?: string;
  duration?: string;
  template?: string;
}) {
  const dbUser = await getAuthenticatedOrGuestUser();

  if (dbUser.accountStatus === "suspended" || dbUser.generationDisabled) {
    throw new Error("Account access has been suspended by an administrator.");
  }

  // 1. Resolve Model
  const model = await db.aIModel.findFirst({
    where: { OR: [{ id: input.modelId }, { slug: input.modelId }] },
    include: { provider: true },
  });

  if (!model || !model.enabled) {
    throw new Error("Selected audio model is unavailable.");
  }

  // 2. Calculate Credit Cost
  let totalCost = model.creditCost || 2;
  if (input.mode === "music") totalCost += 1;
  if (input.script && input.script.length > 500) totalCost += 2;

  // 3. Create Generation record
  const generation = await db.generation.create({
    data: {
      userId: dbUser.id,
      modelId: model.id,
      mediaType: "AUDIO",
      mode: input.mode,
      prompt: input.prompt || input.script || `${input.mode} audio track`,
      voiceId: input.voiceId || null,
      language: input.language || "en",
      duration: input.duration || "15s",
      status: "GENERATING",
      progress: 30,
      creditCost: totalCost,
    },
  });

  // 4. Reserve credits in ledger
  await reserveCredits({
    userId: dbUser.id,
    amount: totalCost,
    generationId: generation.id,
    description: `Reserved ${totalCost} credits for AI Audio generation (${input.mode})`,
  });

  // 5. Submit to Provider Router Adapter (fal.ai/mmaudio or mock)
  const provider = providerRegistry.getProviderForModel(model.provider?.slug);
  const providerJob = await provider.submitGeneration({
    generationId: generation.id,
    userId: dbUser.id,
    modelId: model.id,
    providerModelId: model.providerModelId || undefined,
    prompt: input.prompt || input.script || "Cinematic ambient audio track",
    mode: input.mode,
    duration: input.duration || "15s",
    resolution: "1080p",
    aspectRatio: "16:9",
  });

  // Poll status for fast audio completion
  let statusResult = await provider.getGenerationStatus(providerJob.providerJobId);

  let attempts = 0;
  while (statusResult.status !== "COMPLETED" && statusResult.status !== "FAILED" && attempts < 10) {
    await new Promise((r) => setTimeout(r, 1000));
    attempts++;
    statusResult = await provider.getGenerationStatus(providerJob.providerJobId);
  }

  const rawUrl = statusResult.videoUrl || statusResult.thumbnailUrl || "/werewolf_cinematic_preview.jpg";
  let finalAudioUrl = rawUrl;

  // Transfer file to persistent VANTA storage
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    try {
      const audioRes = await fetch(rawUrl);
      if (audioRes.ok) {
        const buffer = Buffer.from(await audioRes.arrayBuffer());
        const storageKey = `users/${dbUser.id}/generations/${generation.id}/audio.mp3`;
        const storage = getStorageProvider();
        const uploadRes = await storage.upload(buffer, storageKey, "audio/mpeg");
        finalAudioUrl = uploadRes.url;
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
      audioUrl: finalAudioUrl,
      completedAt: new Date(),
    },
  });

  // Create persistent Asset record
  const asset = await db.asset.create({
    data: {
      userId: dbUser.id,
      type: "AUDIO",
      name: `${model.name} - ${input.mode} (${input.duration || "15s"})`,
      url: finalAudioUrl,
      mimeType: "audio/mpeg",
      duration: input.duration || "15s",
      generationId: generation.id,
    },
  });

  revalidatePath("/studio/audio");
  revalidatePath("/assets");
  return { success: true, generation: updatedGen, asset };
}

export async function getUserFavoriteVoicesAction() {
  const user = await getAuthenticatedOrGuestUser();

  const favorites = await db.userFavoriteVoice.findMany({
    where: { userId: user.id },
    select: { voiceId: true },
  });

  return favorites.map((f) => f.voiceId);
}

export async function toggleFavoriteVoiceAction(voiceId: string, name: string) {
  const user = await getAuthenticatedOrGuestUser();

  const existing = await db.userFavoriteVoice.findUnique({
    where: {
      userId_voiceId: {
        userId: user.id,
        voiceId,
      },
    },
  });

  if (existing) {
    await db.userFavoriteVoice.delete({ where: { id: existing.id } });
  } else {
    await db.userFavoriteVoice.create({
      data: {
        userId: user.id,
        voiceId,
        name,
      },
    });
  }

  revalidatePath("/studio/audio");
  return { success: true };
}
