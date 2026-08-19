"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getAdminStatsAction() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [
    totalUsers,
    totalGenerations,
    activeSubscriptions,
    totalWallets,
    recentTransactions,
    users,
    models,
  ] = await Promise.all([
    db.user.count(),
    db.generation.count(),
    db.subscription.count({ where: { status: "active" } }),
    db.creditWallet.aggregate({ _sum: { balance: true } }),
    db.creditTransaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { wallet: { include: { user: true } } },
    }),
    db.user.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        creditWallet: true,
        subscription: { include: { plan: true } },
      },
    }),
    db.aIModel.findMany({ include: { provider: true } }),
  ]);

  return {
    totalUsers,
    totalGenerations,
    activeSubscriptions,
    totalCreditsAllocated: totalWallets._sum.balance || 0,
    recentTransactions,
    users,
    models,
  };
}

export async function adjustUserCreditsAction(targetUserId: string, creditAmount: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  let wallet = await db.creditWallet.findUnique({ where: { userId: targetUserId } });
  if (!wallet) {
    wallet = await db.creditWallet.create({ data: { userId: targetUserId, balance: 0 } });
  }

  await db.$transaction([
    db.creditWallet.update({
      where: { userId: targetUserId },
      data: { balance: { increment: creditAmount } },
    }),
    db.creditTransaction.create({
      data: {
        walletId: wallet.id,
        amount: creditAmount,
        type: "ADMIN_ADJUSTMENT",
        description: `Admin Credit Adjustment (+${creditAmount})`,
      },
    }),
  ]);

  return { success: true };
}
