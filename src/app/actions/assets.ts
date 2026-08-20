"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getActorContext } from "@/lib/guest-auth";

export interface GetAssetsParams {
  tab?: string; // "all" | "videos" | "images" | "audio" | "uploads" | "characters" | "locations" | "references" | "favorites"
  sidebarSection?: string; // "all" | "recent" | "favorites" | "trash" | "folder"
  folderId?: string;
  searchQuery?: string;
  modelFilter?: string;
  typeFilter?: string;
  sortBy?: "newest" | "oldest" | "name";
  page?: number;
  pageSize?: number;
}

export async function getAssetsAction(params: GetAssetsParams = {}) {
  const actor = await getActorContext();

  const {
    tab = "all",
    sidebarSection = "all",
    folderId,
    searchQuery,
    typeFilter,
    sortBy = "newest",
    page = 1,
    pageSize = 24,
  } = params;

  const ownerClause = actor.userId
    ? { userId: actor.userId }
    : { guestSessionId: actor.guestSessionId };

  const where: Record<string, unknown> = { ...ownerClause };

  // Soft delete trash handling
  if (sidebarSection === "trash") {
    where.deletedAt = { not: null };
  } else {
    where.deletedAt = null;
  }

  // Sidebar Section
  if (sidebarSection === "favorites") {
    where.isFavorite = true;
  } else if (sidebarSection === "folder" && folderId) {
    where.folderId = folderId;
  }

  // Top Tabs Filtering
  if (tab === "videos") {
    where.type = "VIDEO";
  } else if (tab === "images") {
    where.type = "IMAGE";
  } else if (tab === "audio") {
    where.type = "AUDIO";
  } else if (tab === "uploads") {
    where.type = "UPLOAD";
  } else if (tab === "characters") {
    where.type = "CHARACTER_REFERENCE";
  } else if (tab === "locations") {
    where.type = "LOCATION_REFERENCE";
  } else if (tab === "references") {
    where.type = { in: ["CHARACTER_REFERENCE", "LOCATION_REFERENCE", "STYLE_REFERENCE"] };
  } else if (tab === "favorites") {
    where.isFavorite = true;
  }

  // Explicit Type Filter
  if (typeFilter && typeFilter !== "ALL") {
    where.type = typeFilter;
  }

  // Search Query (Matches asset name)
  if (searchQuery && searchQuery.trim().length > 0) {
    where.name = { contains: searchQuery.trim() };
  }

  // Sorting
  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (sortBy === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sortBy === "name") {
    orderBy = { name: "asc" };
  }

  try {
    const totalCount = await db.asset.count({ where });

    const assets = await db.asset.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        folder: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return {
      assets,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (err) {
    console.warn("[getAssetsAction] DB read fallback:", err);
    return {
      assets: [],
      totalCount: 0,
      page: 1,
      totalPages: 0,
    };
  }
}

export async function getAssetFoldersAction() {
  try {
    const actor = await getActorContext();
    if (!actor.userId) return [];

    const folders = await db.assetFolder.findMany({
      where: { userId: actor.userId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { assets: { where: { deletedAt: null } } },
        },
      },
    });

    return folders;
  } catch (err) {
    console.warn("[getAssetFoldersAction] DB read fallback:", err);
    return [];
  }
}

export async function createAssetFolderAction(name: string, color?: string) {
  const actor = await getActorContext();
  if (!actor.userId) throw new Error("Folder creation requires registered user account.");

  const folder = await db.assetFolder.create({
    data: {
      userId: actor.userId,
      name: name.trim() || "New Folder",
      color: color || "#c8ff00",
    },
  });

  revalidatePath("/assets");
  return folder;
}

export async function toggleFavoriteAssetAction(assetId: string) {
  const actor = await getActorContext();
  const ownerClause = actor.userId ? { userId: actor.userId } : { guestSessionId: actor.guestSessionId };

  const asset = await db.asset.findFirst({
    where: { id: assetId, ...ownerClause },
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  const updated = await db.asset.update({
    where: { id: assetId },
    data: { isFavorite: !asset.isFavorite },
  });

  revalidatePath("/assets");
  return updated;
}

export async function renameAssetAction(assetId: string, name: string) {
  const actor = await getActorContext();
  const ownerClause = actor.userId ? { userId: actor.userId } : { guestSessionId: actor.guestSessionId };

  const updated = await db.asset.update({
    where: { id: assetId, ...ownerClause },
    data: { name: name.trim() },
  });

  revalidatePath("/assets");
  return updated;
}

export async function moveAssetToFolderAction(assetId: string, folderId: string | null) {
  const actor = await getActorContext();
  if (!actor.userId) throw new Error("Folder operations require registered user account.");

  const updated = await db.asset.update({
    where: { id: assetId, userId: actor.userId },
    data: { folderId },
  });

  revalidatePath("/assets");
  return updated;
}

export async function softDeleteAssetAction(assetId: string) {
  const actor = await getActorContext();
  const ownerClause = actor.userId ? { userId: actor.userId } : { guestSessionId: actor.guestSessionId };

  const updated = await db.asset.update({
    where: { id: assetId, ...ownerClause },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/assets");
  return updated;
}

export async function restoreAssetAction(assetId: string) {
  const actor = await getActorContext();
  const ownerClause = actor.userId ? { userId: actor.userId } : { guestSessionId: actor.guestSessionId };

  const updated = await db.asset.update({
    where: { id: assetId, ...ownerClause },
    data: { deletedAt: null },
  });

  revalidatePath("/assets");
  return updated;
}

export async function permanentDeleteAssetAction(assetId: string) {
  const actor = await getActorContext();
  const ownerClause = actor.userId ? { userId: actor.userId } : { guestSessionId: actor.guestSessionId };

  await db.asset.delete({
    where: { id: assetId, ...ownerClause },
  });

  revalidatePath("/assets");
  return { success: true };
}

export async function emptyTrashAction() {
  const actor = await getActorContext();
  const ownerClause = actor.userId ? { userId: actor.userId } : { guestSessionId: actor.guestSessionId };

  await db.asset.deleteMany({
    where: { ...ownerClause, deletedAt: { not: null } },
  });

  revalidatePath("/assets");
  return { success: true };
}
