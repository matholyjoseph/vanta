"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reserveCredits } from "@/lib/video/pricing";
import { getStorageProvider } from "@/lib/storage";
import { getActorContext, getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { resolveImageProvider } from "@/lib/video/providers/provider-routing";

export async function getImageModelsAction() {
  const actor = await getActorContext();

  const models = await db.aIModel.findMany({
    where: { type: "IMAGE", enabled: true },
    orderBy: [{ isFeatured: "desc" }, { priority: "desc" }, { name: "asc" }],
    include: { provider: true },
  });

  const parsedModels = models.map((m) => ({
    ...m,
    supportedModes: typeof m.supportedModes === "string" ? JSON.parse(m.supportedModes) : m.supportedModes,
    supportedResolutions: typeof m.supportedResolutions === "string" ? JSON.parse(m.supportedResolutions) : m.supportedResolutions,
    supportedAspectRatios: typeof m.supportedAspectRatios === "string" ? JSON.parse(m.supportedAspectRatios) : m.supportedAspectRatios,
  }));

  // Guest users ONLY see mock model to prevent false model labeling
  if (actor.isGuest) {
    return parsedModels.filter(
      (m) => !m.provider?.slug || m.provider?.slug === "vanta-mock" || m.provider?.slug === "mock"
    );
  }

  return parsedModels;
}

export async function submitImageGenerationAction(input: {
  modelId: string;
  mode: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  resolution: string;
  sourceImageUrl?: string;
  maskUrl?: string;
  productTemplate?: string;
  upscaleFactor?: string;
  outputCount?: number;
}) {
  const dbUser = await getAuthenticatedOrGuestUser();
  const actor = await getActorContext();

  if (dbUser.accountStatus === "suspended" || dbUser.generationDisabled) {
    throw new Error("Account access has been suspended by an administrator.");
  }

  // 1. Resolve Model
  const model = await db.aIModel.findFirst({
    where: { OR: [{ id: input.modelId }, { slug: input.modelId }] },
    include: { provider: true },
  });

  if (!model || !model.enabled) {
    throw new Error("Selected image model is unavailable.");
  }

  // 2. Resolve Provider strictly via Server Router
  const { provider, isLiveProvider } = resolveImageProvider({
    actor,
    providerSlug: model.provider?.slug,
    modelSlug: model.slug,
  });

  // Cap outputCount to 1 for live testing to avoid duplicate image issues
  const outputCount = 1;

  // 3. Calculate Credit Cost
  let cost = model.creditCost || 3;
  if (input.mode === "upscale") cost += 2;
  if (input.mode === "product-photography") cost += 2;
  if (input.resolution === "4K") cost += 3;

  const totalCost = cost * outputCount;

  // 4. Create Generation DB record
  const generation = await db.generation.create({
    data: {
      userId: actor.userId || null,
      guestSessionId: actor.guestSessionId || null,
      modelId: model.id,
      mediaType: "IMAGE",
      mode: input.mode,
      prompt: input.prompt.trim(),
      negativePrompt: input.negativePrompt || null,
      status: "GENERATING",
      progress: 20,
      resolution: input.resolution,
      duration: "0s",
      aspectRatio: input.aspectRatio,
      creditCost: totalCost,
      imageUrl: input.sourceImageUrl || null,
      maskUrl: input.maskUrl || null,
    },
  });

  // 5. Reserve credits in ledger
  await reserveCredits({
    userId: dbUser.id,
    amount: totalCost,
    generationId: generation.id,
    description: `Reserved ${totalCost} credits for AI Image synthesis (${input.mode} ${input.aspectRatio})`,
  });

  try {
    // 6. Submit to Resolved Provider Adapter
    const providerJob = await provider.submitGeneration({
      generationId: generation.id,
      userId: dbUser.id,
      modelId: model.id,
      providerModelId: model.providerModelId || "fal-ai/flux/schnell",
      prompt: input.prompt.trim(),
      negativePrompt: input.negativePrompt,
      mode: input.mode,
      duration: "0s",
      resolution: input.resolution,
      aspectRatio: input.aspectRatio,
      referenceImages: input.sourceImageUrl ? [input.sourceImageUrl] : undefined,
    });

    // 7. Poll status for completion
    let statusResult = await provider.getGenerationStatus(providerJob.providerJobId);
    let attempts = 0;
    while (statusResult.status !== "COMPLETED" && statusResult.status !== "FAILED" && attempts < 15) {
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
      statusResult = await provider.getGenerationStatus(providerJob.providerJobId);
    }

    if (statusResult.status === "FAILED") {
      const errMsg = statusResult.errorMessage || "Image generation failed on provider.";
      await db.generation.update({
        where: { id: generation.id },
        data: { status: "FAILED", progress: 0 },
      });
      throw new Error(`Generation failed: ${errMsg}`);
    }

    const rawUrl = statusResult.videoUrl || statusResult.thumbnailUrl;
    if (!rawUrl) {
      await db.generation.update({
        where: { id: generation.id },
        data: { status: "FAILED", progress: 0 },
      });
      throw new Error("Provider returned no valid output image URL.");
    }

    let finalImageUrl = rawUrl;

    // Transfer file to persistent VANTA storage if remote URL
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      try {
        const imgRes = await fetch(rawUrl);
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const storageKey = actor.userId
            ? `users/${actor.userId}/generations/${generation.id}/output-1.png`
            : `guests/${actor.guestSessionId}/generations/${generation.id}/output-1.png`;
          const storage = getStorageProvider();
          const uploadRes = await storage.upload(buffer, storageKey, "image/png");
          finalImageUrl = uploadRes.url;
        }
      } catch {
        // fallback to raw URL
      }
    }

    // 8. Update Generation DB record
    const updatedGen = await db.generation.update({
      where: { id: generation.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        imageUrl: finalImageUrl,
        thumbnailUrl: finalImageUrl,
        completedAt: new Date(),
      },
    });

    // 9. Create persistent Asset record
    const asset = await db.asset.create({
      data: {
        userId: actor.userId || null,
        guestSessionId: actor.guestSessionId || null,
        type: "IMAGE",
        name: `${model.name} - ${input.prompt.trim().substring(0, 30)}`,
        url: finalImageUrl,
        thumbnailUrl: finalImageUrl,
        mimeType: "image/png",
        resolution: input.resolution,
        generationId: generation.id,
      },
    });

    revalidatePath("/studio/image");
    revalidatePath("/assets");
    return { success: true, generation: updatedGen, asset, isLiveProvider };
  } catch (err: any) {
    // CRITICAL: Fail loudly! NEVER return mock wolf fixtures on provider failure!
    await db.generation.update({
      where: { id: generation.id },
      data: { status: "FAILED", progress: 0 },
    });
    throw err;
  }
}

export async function saveAsProjectElementAction(params: {
  name: string;
  type: "CHARACTER" | "LOCATION" | "PROP" | "STYLE";
  referenceAssetId: string;
  prompt?: string;
}) {
  const user = await getAuthenticatedOrGuestUser();

  let project = await db.project.findFirst({
    where: { userId: user.id },
  });

  if (!project) {
    project = await db.project.create({
      data: {
        userId: user.id,
        name: "My AI Production Project",
        description: "Default workspace project for character and location assets.",
      },
    });
  }

  const element = await db.projectElement.create({
    data: {
      projectId: project.id,
      name: params.name,
      type: params.type,
      referenceAssetId: params.referenceAssetId,
      prompt: params.prompt || null,
    },
  });

  revalidatePath("/assets");
  revalidatePath("/projects");
  return { success: true, element };
}
