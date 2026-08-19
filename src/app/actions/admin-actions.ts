"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedAdmin, logAdminAudit, AdminRole } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { refundCredits } from "@/lib/video/pricing";
import { falVideoProvider } from "@/lib/video/providers/fal-provider";

// ─── 1. OVERVIEW KPIS & ANALYTICS ─────────────────────────────────────────────
export async function getAdminOverviewAction() {
  const admin = await getAuthenticatedAdmin(["SUPPORT", "MODERATOR", "ADMIN", "SUPER_ADMIN"]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    activePaidUsers,
    newUsersToday,
    newUsersMonth,
    totalGenerations,
    generationsToday,
    successfulGenerations,
    failedGenerations,
    walletAggregate,
    recentAuditLogs,
    providers,
    activeJobsCount,
    failedJobsCount,
  ] = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { status: "active" } }),
    db.user.count({ where: { createdAt: { gte: startOfToday } } }),
    db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.generation.count(),
    db.generation.count({ where: { createdAt: { gte: startOfToday } } }),
    db.generation.count({ where: { status: "COMPLETED" } }),
    db.generation.count({ where: { status: "FAILED" } }),
    db.creditWallet.aggregate({ _sum: { balance: true } }),
    db.auditLog.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { adminUser: true } }),
    db.aIProvider.findMany({ include: { models: true } }),
    db.generation.count({ where: { status: { in: ["QUEUED", "SUBMITTED", "GENERATING", "PROCESSING"] } } }),
    db.generationJob.count({ where: { attempts: { gte: 3 } } }),
  ]);

  // Provider health calculation
  const providerStats = providers.map((p) => {
    const totalModels = p.models.length;
    const enabledModels = p.models.filter((m) => m.enabled).length;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      enabled: p.enabled,
      modelCount: totalModels,
      enabledModelCount: enabledModels,
    };
  });

  return {
    adminRole: admin.role,
    totalUsers,
    activePaidUsers,
    newUsersToday,
    newUsersMonth,
    totalGenerations,
    generationsToday,
    successfulGenerations,
    failedGenerations,
    totalCreditsAllocated: walletAggregate._sum.balance || 0,
    estimatedSubscriptionRevenue: activePaidUsers * 49,
    estimatedProviderCost: (successfulGenerations * 0.05).toFixed(2),
    estimatedGrossProfit: (activePaidUsers * 49 - successfulGenerations * 0.05).toFixed(2),
    activeJobsCount,
    failedJobsCount,
    providerStats,
    recentAuditLogs,
  };
}

// ─── 2. USERS MANAGEMENT ──────────────────────────────────────────────────────
export async function getAdminUsersAction(params?: {
  search?: string;
  role?: string;
  plan?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  await getAuthenticatedAdmin(["SUPPORT", "ADMIN", "SUPER_ADMIN"]);

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (params?.search) {
    whereClause.OR = [
      { name: { contains: params.search } },
      { email: { contains: params.search } },
      { id: { equals: params.search } },
    ];
  }

  if (params?.role && params.role !== "ALL") {
    whereClause.role = params.role;
  }

  if (params?.status && params.status !== "ALL") {
    whereClause.accountStatus = params.status;
  }

  const [users, totalCount] = await Promise.all([
    db.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        creditWallet: true,
        subscription: { include: { plan: true } },
        _count: { select: { generations: true, assets: true, projects: true } },
      },
    }),
    db.user.count({ where: whereClause }),
  ]);

  return {
    users,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

// User Detail Fetcher
export async function getAdminUserDetailAction(userId: string) {
  await getAuthenticatedAdmin(["SUPPORT", "ADMIN", "SUPER_ADMIN"]);

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      creditWallet: {
        include: {
          transactions: { take: 15, orderBy: { createdAt: "desc" } },
        },
      },
      subscription: { include: { plan: true } },
      generations: { take: 10, orderBy: { createdAt: "desc" }, include: { model: true } },
      assets: { take: 10, orderBy: { createdAt: "desc" } },
      projects: { take: 10, orderBy: { updatedAt: "desc" } },
    },
  });

  if (!user) throw new Error("User not found.");

  return { user };
}

// ─── 3. MANUAL CREDIT ADJUSTMENT ─────────────────────────────────────────────
export async function adjustUserCreditsAdminAction(params: {
  targetUserId: string;
  amount: number;
  operation: "ADD" | "REMOVE";
  reason: string;
}) {
  const admin = await getAuthenticatedAdmin(["ADMIN", "SUPER_ADMIN"]);

  let wallet = await db.creditWallet.findUnique({ where: { userId: params.targetUserId } });
  if (!wallet) {
    wallet = await db.creditWallet.create({ data: { userId: params.targetUserId, balance: 0 } });
  }

  const delta = params.operation === "ADD" ? Math.abs(params.amount) : -Math.abs(params.amount);
  const newBalance = wallet.balance + delta;

  if (newBalance < 0) {
    throw new Error(`Cannot complete credit reduction. Wallet balance would become negative (${newBalance}).`);
  }

  await db.$transaction([
    db.creditWallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    }),
    db.creditTransaction.create({
      data: {
        walletId: wallet.id,
        amount: delta,
        type: "ADMIN_ADJUSTMENT",
        description: `Admin Adjustment (${params.operation === "ADD" ? "+" : ""}${delta}): ${params.reason}`,
        adminUserId: admin.id,
      },
    }),
  ]);

  await logAdminAudit({
    adminUserId: admin.id,
    action: "CREDIT_ADJUSTMENT",
    targetType: "User",
    targetId: params.targetUserId,
    beforeData: { balance: wallet.balance },
    afterData: { balance: newBalance },
    reason: params.reason,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/credits");
  return { success: true, newBalance };
}

// ─── USER ROLE & SUSPENSION ──────────────────────────────────────────────────
export async function changeUserRoleAction(targetUserId: string, newRole: AdminRole) {
  const admin = await getAuthenticatedAdmin(["SUPER_ADMIN"]);

  const existing = await db.user.findUnique({ where: { id: targetUserId } });
  if (!existing) throw new Error("User not found.");

  await db.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  await logAdminAudit({
    adminUserId: admin.id,
    action: "ROLE_CHANGE",
    targetType: "User",
    targetId: targetUserId,
    beforeData: { role: existing.role },
    afterData: { role: newRole },
    reason: "Role updated by Super Admin",
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserSuspensionAction(targetUserId: string, suspend: boolean, reason?: string) {
  const admin = await getAuthenticatedAdmin(["ADMIN", "SUPER_ADMIN"]);

  const status = suspend ? "suspended" : "active";

  await db.user.update({
    where: { id: targetUserId },
    data: {
      accountStatus: status,
      suspendedAt: suspend ? new Date() : null,
      suspendedBy: suspend ? admin.id : null,
      suspensionReason: suspend ? reason || "Suspended by Administrator" : null,
      generationDisabled: suspend,
    },
  });

  await logAdminAudit({
    adminUserId: admin.id,
    action: suspend ? "USER_SUSPENSION" : "USER_UNSUSPENSION",
    targetType: "User",
    targetId: targetUserId,
    reason,
  });

  revalidatePath("/admin/users");
  return { success: true, status };
}

// ─── 4. GENERATIONS ──────────────────────────────────────────────────────────
export async function getAdminGenerationsAction(params?: {
  status?: string;
  modelId?: string;
  providerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await getAuthenticatedAdmin(["SUPPORT", "ADMIN", "SUPER_ADMIN"]);

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (params?.status && params.status !== "ALL") {
    whereClause.status = params.status;
  }

  if (params?.modelId && params.modelId !== "ALL") {
    whereClause.modelId = params.modelId;
  }

  if (params?.search) {
    whereClause.OR = [
      { prompt: { contains: params.search } },
      { id: { equals: params.search } },
      { providerJobId: { contains: params.search } },
      { user: { email: { contains: params.search } } },
    ];
  }

  const [generations, totalCount] = await Promise.all([
    db.generation.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        model: { include: { provider: true } },
      },
    }),
    db.generation.count({ where: whereClause }),
  ]);

  return {
    generations,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

export async function refundGenerationAdminAction(generationId: string, reason: string) {
  const admin = await getAuthenticatedAdmin(["ADMIN", "SUPER_ADMIN"]);

  const gen = await db.generation.findUnique({ where: { id: generationId } });
  if (!gen) throw new Error("Generation not found.");

  await refundCredits({
    userId: gen.userId || gen.guestSessionId || "guest-user",
    amount: gen.creditCost,
    generationId: gen.id,
    reason: `Admin Refund: ${reason}`,
  });

  await logAdminAudit({
    adminUserId: admin.id,
    action: "GENERATION_REFUND",
    targetType: "Generation",
    targetId: generationId,
    reason,
  });

  revalidatePath("/admin/generations");
  return { success: true };
}

// ─── 6. AI MODELS & PRICING ──────────────────────────────────────────────────
export async function getAdminModelsAction() {
  await getAuthenticatedAdmin(["SUPPORT", "ADMIN", "SUPER_ADMIN"]);

  const models = await db.aIModel.findMany({
    orderBy: { priority: "desc" },
    include: { provider: true, pricings: true },
  });

  const providers = await db.aIProvider.findMany();

  return { models, providers };
}

export async function updateModelSettingsAction(modelId: string, data: any) {
  const admin = await getAuthenticatedAdmin(["ADMIN", "SUPER_ADMIN"]);

  const existing = await db.aIModel.findUnique({ where: { id: modelId } });
  if (!existing) throw new Error("Model not found.");

  const updated = await db.aIModel.update({
    where: { id: modelId },
    data: {
      name: data.name,
      description: data.description,
      creditCost: data.creditCost,
      providerEstimatedCost: data.providerEstimatedCost,
      enabled: data.enabled,
      isDefault: data.isDefault,
      isNew: data.isNew,
      isPopular: data.isPopular,
      isFeatured: data.isFeatured,
      requiredPlan: data.requiredPlan,
    },
  });

  await logAdminAudit({
    adminUserId: admin.id,
    action: "MODEL_UPDATE",
    targetType: "AIModel",
    targetId: modelId,
    beforeData: { enabled: existing.enabled, creditCost: existing.creditCost },
    afterData: { enabled: updated.enabled, creditCost: updated.creditCost },
  });

  revalidatePath("/admin/models");
  revalidatePath("/studio/video");
  return { success: true, model: updated };
}

// ─── 10. PROVIDERS ───────────────────────────────────────────────────────────
export async function updateProviderStatusAction(providerId: string, status: string, enabled: boolean) {
  const admin = await getAuthenticatedAdmin(["ADMIN", "SUPER_ADMIN"]);

  const updated = await db.aIProvider.update({
    where: { id: providerId },
    data: { status, enabled },
  });

  await logAdminAudit({
    adminUserId: admin.id,
    action: "PROVIDER_STATUS_CHANGE",
    targetType: "AIProvider",
    targetId: providerId,
    afterData: { status, enabled },
  });

  revalidatePath("/admin/providers");
  return { success: true, provider: updated };
}

export async function testProviderConnectionAction(providerSlug: string) {
  await getAuthenticatedAdmin(["ADMIN", "SUPER_ADMIN"]);

  if (providerSlug.toLowerCase() === "fal") {
    const falKey = process.env.FAL_KEY;
    const isConfigured = !!falKey && falKey.trim() !== "";
    if (!isConfigured) {
      return {
        success: false,
        configured: false,
        message: "FAL_KEY is missing in server environment variables (.env).",
      };
    }

    try {
      const isHealthy = await falVideoProvider.healthCheck();
      return {
        success: isHealthy,
        configured: true,
        message: isHealthy ? "fal.ai API connection successful!" : "fal.ai health check returned offline.",
      };
    } catch (err: any) {
      return {
        success: false,
        configured: true,
        message: err.message || "Failed to connect to fal.ai API.",
      };
    }
  }

  return {
    success: true,
    configured: true,
    message: "Mock Provider active (Development mode).",
  };
}

// ─── 13. SUBSCRIPTIONS ───────────────────────────────────────────────────────
export async function getAdminSubscriptionsAction(params?: { planKey?: string; status?: string; page?: number }) {
  await getAuthenticatedAdmin(["SUPPORT", "ADMIN", "SUPER_ADMIN"]);

  const page = params?.page || 1;
  const limit = 20;

  const whereClause: any = {};
  if (params?.status && params.status !== "ALL") whereClause.status = params.status;

  const [subscriptions, totalCount] = await Promise.all([
    db.subscription.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true,
      },
    }),
    db.subscription.count({ where: whereClause }),
  ]);

  return { subscriptions, totalCount };
}

// ─── 17. ASSETS & MODERATION ─────────────────────────────────────────────────
export async function getAdminAssetsAction(params?: { type?: string; page?: number }) {
  await getAuthenticatedAdmin(["SUPPORT", "MODERATOR", "ADMIN", "SUPER_ADMIN"]);

  const page = params?.page || 1;
  const limit = 20;

  const whereClause: any = {};
  if (params?.type && params.type !== "ALL") whereClause.type = params.type;

  const [assets, totalCount] = await Promise.all([
    db.asset.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    db.asset.count({ where: whereClause }),
  ]);

  return { assets, totalCount };
}

export async function toggleAssetRestrictionAction(assetId: string, isRestricted: boolean) {
  const admin = await getAuthenticatedAdmin(["MODERATOR", "ADMIN", "SUPER_ADMIN"]);

  await db.asset.update({
    where: { id: assetId },
    data: { isRestricted },
  });

  await logAdminAudit({
    adminUserId: admin.id,
    action: isRestricted ? "ASSET_RESTRICTED" : "ASSET_UNRESTRICTED",
    targetType: "Asset",
    targetId: assetId,
  });

  revalidatePath("/admin/assets");
  return { success: true };
}

// ─── 22. COUPONS ─────────────────────────────────────────────────────────────
export async function getAdminCouponsAction() {
  await getAuthenticatedAdmin(["ADMIN", "SUPER_ADMIN"]);
  const coupons = await db.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return { coupons };
}

export async function createPromoCodeAction(data: {
  code: string;
  creditAmount: number;
  maxRedemptions: number;
  newUsersOnly?: boolean;
}) {
  const admin = await getAuthenticatedAdmin(["ADMIN", "SUPER_ADMIN"]);

  const code = data.code.toUpperCase().trim();
  const promo = await db.promoCode.create({
    data: {
      code,
      creditAmount: data.creditAmount,
      maxRedemptions: data.maxRedemptions,
      newUsersOnly: data.newUsersOnly || false,
    },
  });

  await logAdminAudit({
    adminUserId: admin.id,
    action: "PROMO_CODE_CREATED",
    targetType: "PromoCode",
    targetId: promo.id,
    afterData: { code, creditAmount: data.creditAmount },
  });

  revalidatePath("/admin/coupons");
  return { success: true, promo };
}

// ─── 27. FEATURE FLAGS & SETTINGS ───────────────────────────────────────────
export async function getAdminSettingsAction() {
  await getAuthenticatedAdmin(["ADMIN", "SUPER_ADMIN"]);

  const [featureFlags, systemSettings] = await Promise.all([
    db.featureFlag.findMany({ orderBy: { key: "asc" } }),
    db.systemSetting.findMany({ orderBy: { key: "asc" } }),
  ]);

  return { featureFlags, systemSettings };
}

export async function toggleFeatureFlagAction(flagId: string, enabled: boolean) {
  const admin = await getAuthenticatedAdmin(["ADMIN", "SUPER_ADMIN"]);

  const flag = await db.featureFlag.update({
    where: { id: flagId },
    data: { enabled },
  });

  await logAdminAudit({
    adminUserId: admin.id,
    action: "FEATURE_FLAG_TOGGLE",
    targetType: "FeatureFlag",
    targetId: flagId,
    afterData: { key: flag.key, enabled },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/studio/video");
  return { success: true, flag };
}

// ─── 29. AUDIT LOGS ──────────────────────────────────────────────────────────
export async function getAdminAuditLogsAction(page: number = 1) {
  await getAuthenticatedAdmin(["ADMIN", "SUPER_ADMIN"]);

  const limit = 30;
  const [auditLogs, totalCount] = await Promise.all([
    db.auditLog.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { adminUser: { select: { id: true, name: true, email: true, role: true } } },
    }),
    db.auditLog.count(),
  ]);

  return { auditLogs, totalCount, totalPages: Math.ceil(totalCount / limit) };
}
