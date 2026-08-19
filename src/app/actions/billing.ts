"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, STRIPE_CREDIT_PACKS } from "@/lib/stripe";
import { ensureSubscriptionPlansSeeded, DEFAULT_PLANS } from "@/lib/plans-config";

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    throw new Error("Unauthorized: Please sign in.");
  }

  let user = null;
  if (session?.user?.id) {
    user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: { include: { plan: true } }, creditWallet: true },
    });
  }

  if (!user && session?.user?.email) {
    user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: { include: { plan: true } }, creditWallet: true },
    });
  }

  if (!user) {
    throw new Error("User account not found.");
  }

  return user;
}

export async function createCheckoutSessionAction(planKey: string, isAnnual: boolean = false) {
  const user = await getAuthenticatedUser();
  await ensureSubscriptionPlansSeeded();

  const plan = await db.subscriptionPlan.findUnique({ where: { key: planKey } });
  if (!plan) {
    throw new Error("Invalid plan selected");
  }

  if (plan.key === "FREE") {
    // If selecting Free plan, switch subscription locally
    const freePlan = await db.subscriptionPlan.findUnique({ where: { key: "FREE" } });
    if (freePlan) {
      await db.subscription.upsert({
        where: { userId: user.id },
        update: {
          planId: freePlan.id,
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        create: {
          userId: user.id,
          planId: freePlan.id,
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
    revalidatePath("/pricing");
    return { url: "/pricing?success=free" };
  }

  const priceAmount = isAnnual ? plan.annualPrice * 12 : plan.monthlyPrice;

  const headerList = await headers();
  const origin = headerList.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Create Stripe Checkout Session using server-side security
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: user.email || undefined,
    client_reference_id: user.id,
    metadata: {
      userId: user.id,
      planKey: plan.key,
      billingCycle: isAnnual ? "annual" : "monthly",
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `VANTA AI — ${plan.name} (${isAnnual ? "Annual" : "Monthly"})`,
            description: plan.description,
          },
          unit_amount: priceAmount * 100, // In cents
          recurring: {
            interval: isAnnual ? "year" : "month",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=true`,
  });

  return { url: session.url };
}

export async function createCreditPackCheckoutSessionAction(packId: string) {
  const user = await getAuthenticatedUser();

  const pack = STRIPE_CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    throw new Error("Invalid credit pack selected");
  }

  const headerList = await headers();
  const origin = headerList.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email || undefined,
    client_reference_id: user.id,
    metadata: {
      userId: user.id,
      type: "CREDIT_PACK",
      credits: pack.credits.toString(),
      packId: pack.id,
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `VANTA AI — ${pack.name}`,
            description: `One-time top up of ${pack.credits.toLocaleString()} generation credits.`,
          },
          unit_amount: pack.priceUSD * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/pricing?success=pack&credits=${pack.credits}`,
    cancel_url: `${origin}/pricing?canceled=true`,
  });

  return { url: session.url };
}

export async function createCustomerPortalSessionAction() {
  const user = await getAuthenticatedUser();

  const headerList = await headers();
  const origin = headerList.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

  let stripeCustomerId = user.subscription?.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/pricing`,
  });

  return { url: portalSession.url };
}

export async function getUserBillingDetailsAction() {
  const user = await getAuthenticatedUser();
  await ensureSubscriptionPlansSeeded();

  let subscription = user.subscription;
  if (!subscription) {
    const freePlan = await db.subscriptionPlan.findUnique({ where: { key: "FREE" } });
    if (freePlan) {
      subscription = await db.subscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        include: { plan: true },
      });
    }
  }

  let wallet = user.creditWallet;
  if (!wallet) {
    wallet = await db.creditWallet.create({
      data: { userId: user.id, balance: 2450 },
    });
  }

  const transactions = await db.creditTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const plans = await db.subscriptionPlan.findMany({
    orderBy: { monthlyPrice: "asc" },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    subscription,
    wallet,
    transactions,
    plans: plans.length > 0 ? plans : DEFAULT_PLANS,
  };
}
