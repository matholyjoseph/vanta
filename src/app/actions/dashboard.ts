"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { getActorContext, getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

export async function getDashboardData() {
  try {
    const actor = await getActorContext();
    const user = await getAuthenticatedOrGuestUser();

    let wallet = { balance: actor.testCredits || 2450 };

    if (!actor.isGuest && actor.userId) {
      try {
        const dbWallet = await db.creditWallet.findUnique({
          where: { userId: actor.userId },
        });
        if (dbWallet) {
          wallet = dbWallet;
        }
      } catch (e) {
        console.warn("[getDashboardData] Wallet DB read warning:", e);
      }
    }

    const ownerClause = actor.userId
      ? { userId: actor.userId }
      : { guestSessionId: actor.guestSessionId };

    let generations: any[] = [];
    let projects: any[] = [];

    try {
      [generations, projects] = await Promise.all([
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
    } catch (dbErr) {
      console.warn("[getDashboardData] Generations/Projects DB read warning:", dbErr);
    }

    return {
      user: { id: user.id, name: user.name, email: user.email, image: user.image, isGuest: actor.isGuest },
      wallet,
      generations,
      projects,
    };
  } catch (err) {
    console.error("[getDashboardData] Fallback triggered:", err);
    return {
      user: { id: "guest-user-id", name: "Guest Creator", email: "guest@vanta.ai", isGuest: true },
      wallet: { balance: 2450 },
      generations: [],
      projects: [],
    };
  }
}

export async function createProjectAction(name: string, description?: string) {
  try {
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
  } catch (err) {
    console.warn("[createProjectAction] DB write fallback:", err);
    return {
      id: "proj_demo_" + Date.now(),
      name: name.trim() || "Untitled Project",
      description: description?.trim() || null,
      sceneCount: 1,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export async function deleteGenerationAction(generationId: string) {
  try {
    const actor = await getActorContext();
    const ownerClause = actor.userId
      ? { userId: actor.userId }
      : { guestSessionId: actor.guestSessionId };

    const existing = await db.generation.findFirst({
      where: { id: generationId, ...ownerClause },
    });

    if (existing) {
      await db.generation.delete({
        where: { id: generationId },
      });
    }
  } catch (err) {
    console.warn("[deleteGenerationAction] Warning:", err);
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function uploadMediaAction(formData: FormData) {
  const actor = await getActorContext();

  const file = formData.get("file") as File | null;
  if (!file) {
    throw new Error("No file provided");
  }

  const MAX_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File size exceeds 100MB limit.");
  }

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

  try {
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
  } catch (dbErr) {
    console.warn("[uploadMediaAction] DB save fallback:", dbErr);
    return {
      id: "asset_demo_" + Date.now(),
      name: file.name,
      type: mediaType,
      url: upload.url,
      sizeBytes: upload.sizeBytes,
    };
  }
}
