import { db } from "@/lib/db";

export interface CostCalculationInput {
  modelId: string;
  duration: string;
  resolution: string;
  audio?: boolean;
  outputCount?: number;
}

export async function calculateGenerationCost(input: CostCalculationInput): Promise<number> {
  const { modelId, duration, resolution, audio, outputCount = 1 } = input;

  const model = await db.aIModel.findFirst({
    where: { OR: [{ id: modelId }, { slug: modelId }] },
  });

  if (!model) {
    // Fallback default pricing
    let base = 8;
    if (resolution === "1080p") base += 4;
    if (resolution === "4K") base += 12;
    if (duration === "10s") base += 7;
    if (duration === "15s") base += 15;
    if (audio) base += 2;
    return base * outputCount;
  }

  let pricingRules: Record<string, number> = {};
  if (model.pricingRules) {
    try {
      pricingRules = JSON.parse(model.pricingRules as string);
    } catch {
      pricingRules = {};
    }
  }

  const key = `${duration}_${resolution}`;
  let cost = pricingRules[key] || model.creditCost || 8;

  if (audio && model.supportsAudio) {
    cost += 2;
  }

  return Math.max(1, cost * outputCount);
}

export async function checkConcurrencyLimit(userId: string): Promise<void> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  const maxConcurrent = subscription?.plan?.maxConcurrentGenerations ?? 1;

  const activeCount = await db.generation.count({
    where: {
      userId,
      status: { in: ["QUEUED", "SUBMITTED", "GENERATING", "PROCESSING"] },
    },
  });

  if (activeCount >= maxConcurrent) {
    throw new Error(
      `CONCURRENCY_LIMIT_REACHED: Your plan allows a maximum of ${maxConcurrent} concurrent generation${
        maxConcurrent > 1 ? "s" : ""
      }. Please wait for your current render to complete.`
    );
  }
}

export async function reserveCredits(data: {
  userId: string;
  amount: number;
  generationId: string;
  description: string;
}): Promise<void> {
  const { userId, amount, generationId, description } = data;

  await db.$transaction(async (tx) => {
    let wallet = await tx.creditWallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await tx.creditWallet.create({
        data: { userId, balance: 100 },
      });
    }

    if (wallet.balance < amount) {
      throw new Error("INSUFFICIENT_CREDITS: You don't have enough credits for this generation.");
    }

    // Deduct amount
    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    });

    // Create immutable ledger record
    await tx.creditTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        type: "GENERATION_RESERVE",
        description,
        generationId,
      },
    });
  });
}

export async function refundCredits(data: {
  userId: string;
  amount: number;
  generationId: string;
  reason: string;
}): Promise<void> {
  const { userId, amount, generationId, reason } = data;

  await db.$transaction(async (tx) => {
    const wallet = await tx.creditWallet.findUnique({ where: { userId } });
    if (!wallet) return;

    // Idempotency check: verify credits for this generationId haven't already been refunded
    const existingRefund = await tx.creditTransaction.findFirst({
      where: {
        walletId: wallet.id,
        generationId,
        type: "GENERATION_REFUND",
      },
    });

    if (existingRefund) {
      return; // Already refunded, prevent duplicate charges/refunds
    }

    // Add amount back
    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    });

    await tx.creditTransaction.create({
      data: {
        walletId: wallet.id,
        amount: amount,
        type: "GENERATION_REFUND",
        description: `Refund: ${reason}`,
        generationId,
      },
    });
  });
}
