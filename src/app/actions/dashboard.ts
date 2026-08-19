"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { getActorContext, getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

export async function getDashboardData() {
  const actor = await getActorContext();
  const user = await getAuthenticatedOrGuestUser();

  let wallet = { balance: actor.testCredits };

  if (!actor.isGuest && actor.userId) {
    const dbWallet = await db.creditWallet.findUnique({
      where: { userId: actor.userId },
    });
    if (dbWallet) {
      wallet = dbWallet;
    } else {
      const newWallet = await db.creditWallet.create({
        data: {
          userId: actor.userId,
          balance: 2450,
          transactions: {
            create: {
              amount: 2450,
              type: "bonus",
              description: "Initial studio credit allocation",
            },
          },
        },
      });
      wallet = newWallet;
    }
  }

  const ownerClause = actor.userId
    ? { userId: actor.userId }
    : { guestSessionId: actor.guestSessionId };

  const [generations, projects] = await Promise.all([
    db.generation.findMany({
      where: ownerClause,
      orderBy: { createdAt: "desc" },
      include: { model: true },
      take: 6,
    }),
    db.project.findMany({
      where: ownerClause,
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  return {
    user: { id: user.id, name: user.name, email: user.email, image: user.image, isGuest: actor.isGuest },
    wallet,
    generations,
    projects,
  };
}

export async function createProjectAction(name: string, description?: string) {
  const user = await getAuthenticatedOrGuestUser();

  const project = await db.project.create({
    data: {
      userId: user.id,
      name: name.trim() || "Untitled Project",
      description: description?.trim() || null,
      sceneCount: 1,
      status: "active",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  return project;
}

export async function deleteGenerationAction(generationId: string) {
  const actor = await getActorContext();
  const ownerClause = actor.userId
    ? { userId: actor.userId }
    : { guestSessionId: actor.guestSessionId };

  // Verify ownership before deletion
  const existing = await db.generation.findFirst({
    where: { id: generationId, ...ownerClause },
  });

  if (!existing) {
    throw new Error("Generation record not found or access denied.");
  }

  await db.generation.delete({
    where: { id: generationId },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function uploadMediaAction(formData: FormData) {
  const actor = await getActorContext();

  const file = formData.get("file") as File | null;
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate size (< 100MB)
  const MAX_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File size exceeds 100MB limit.");
  }

  // Validate type
  const allowedTypes = [
    "video/mp4",
    "video/webm",
    "image/jpeg",
    "image/png",
    "image/webp",
    "audio/mpeg",
    "audio/wav",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Unsupported file type. Please upload MP4, WEBM, PNG, JPG, or MP3.");
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const upload = await storage.uploadFile(fileBuffer, file.name, file.type);

  const mediaType = file.type.startsWith("video/")
    ? "VIDEO"
    : file.type.startsWith("image/")
    ? "IMAGE"
    : "AUDIO";

  const asset = await db.asset.create({
    data: {
      userId: actor.userId || null,
      guestSessionId: actor.guestSessionId || null,
      name: file.name,
      type: mediaType as any,
      url: upload.url,
      sizeBytes: upload.sizeBytes,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/assets");
  return asset;
}
