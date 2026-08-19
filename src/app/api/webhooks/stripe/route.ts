import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock_secret_key";

  let event: Stripe.Event;

  try {
    if (signature && process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // In dev fallback, parse payload safely
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Signature failure";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  const eventType = event.type;

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id;
        const paymentIntentId = (session.payment_intent as string) || session.id;

        if (!userId) break;

        // Idempotency check: Ensure paymentIntentId hasn't been credited already
        const existingTx = await db.creditTransaction.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
        });

        if (existingTx) {
          console.log(`Webhook idempotency triggered: Event ${event.id} already processed.`);
          return NextResponse.json({ received: true, duplicate: true });
        }

        // Fetch user wallet
        let wallet = await db.creditWallet.findUnique({ where: { userId } });
        if (!wallet) {
          wallet = await db.creditWallet.create({ data: { userId, balance: 0 } });
        }

        // Case A: Credit Pack Purchase
        if (session.metadata?.type === "CREDIT_PACK") {
          const creditsGranted = parseInt(session.metadata.credits || "500", 10);

          await db.$transaction([
            db.creditWallet.update({
              where: { userId },
              data: { balance: { increment: creditsGranted } },
            }),
            db.creditTransaction.create({
              data: {
                walletId: wallet.id,
                amount: creditsGranted,
                type: "PURCHASE",
                description: `Purchased ${creditsGranted.toLocaleString()} Extra Credit Pack`,
                stripePaymentIntentId: paymentIntentId,
              },
            }),
          ]);
        }

        // Case B: Subscription Plan Checkout
        if (session.metadata?.planKey) {
          const planKey = session.metadata.planKey;
          const plan = await db.subscriptionPlan.findUnique({ where: { key: planKey } });

          if (plan) {
            const monthlyCredits = plan.monthlyCredits;

            await db.subscription.upsert({
              where: { userId },
              update: {
                planId: plan.id,
                stripeCustomerId: (session.customer as string) || null,
                stripeSubscriptionId: (session.subscription as string) || null,
                status: "active",
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
              create: {
                userId,
                planId: plan.id,
                stripeCustomerId: (session.customer as string) || null,
                stripeSubscriptionId: (session.subscription as string) || null,
                status: "active",
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });

            // Grant plan monthly credits
            await db.$transaction([
              db.creditWallet.update({
                where: { userId },
                data: { balance: { increment: monthlyCredits } },
              }),
              db.creditTransaction.create({
                data: {
                  walletId: wallet.id,
                  amount: monthlyCredits,
                  type: "SUBSCRIPTION_GRANT",
                  description: `Monthly Subscription Credit Grant (${plan.name})`,
                  stripePaymentIntentId: paymentIntentId,
                },
              }),
            ]);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const sub = await db.subscription.findFirst({
          where: { stripeCustomerId: customerId },
          include: { plan: true },
        });

        const paymentIntentId = (invoice as unknown as Record<string, unknown>).payment_intent as string | undefined;

        if (sub && paymentIntentId) {
          // Idempotency check
          const existingTx = await db.creditTransaction.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          });

          if (!existingTx) {
            const wallet = await db.creditWallet.findUnique({ where: { userId: sub.userId } });
            if (wallet) {
              await db.$transaction([
                db.creditWallet.update({
                  where: { userId: sub.userId },
                  data: { balance: { increment: sub.plan.monthlyCredits } },
                }),
                db.creditTransaction.create({
                  data: {
                    walletId: wallet.id,
                    amount: sub.plan.monthlyCredits,
                    type: "SUBSCRIPTION_GRANT",
                    description: `Recurring Monthly Credits (${sub.plan.name})`,
                    stripePaymentIntentId: paymentIntentId,
                  },
                }),
              ]);
            }
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subId = subscription.id;

        const sub = await db.subscription.findFirst({
          where: { stripeSubscriptionId: subId },
        });

        if (sub) {
          await db.subscription.update({
            where: { id: sub.id },
            data: {
              status: subscription.status === "active" ? "active" : "canceled",
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("Stripe Webhook Processing Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
