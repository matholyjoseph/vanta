import * as React from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserBillingDetailsAction } from "@/app/actions/billing";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PricingPresentation, type PlanItem } from "@/components/pricing/pricing-presentation";
import { BillingDashboard } from "@/components/pricing/billing-dashboard";
import { ToastProvider } from "@/components/ui/toast";
import { DEFAULT_PLANS } from "@/lib/plans-config";

export const metadata: Metadata = {
  title: "Pricing & Billing Plans — Vanta AI",
  description: "Simple, transparent pricing for professional AI video creators.",
};

export default async function PricingPage() {
  const session = await auth();

  let user = null;
  if (session?.user?.id) {
    user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    });
  }

  if (!user && session?.user?.email) {
    user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true },
    });
  }

  const userId = user?.id;

  let billingData: Awaited<ReturnType<typeof getUserBillingDetailsAction>> | null = null;

  if (userId) {
    try {
      billingData = await getUserBillingDetailsAction();
    } catch {
      // Fallback for session error
    }
  }

  const isAuthenticated = !!userId;
  const userName = user?.name || (user?.email ? user.email.split("@")[0] : "Creator");
  const creditBalance = billingData?.wallet?.balance ?? 2450;
  const currentPlanKey = billingData?.subscription?.plan?.key || "FREE";
  const plans = billingData?.plans || DEFAULT_PLANS;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {isAuthenticated ? (
          <div className="h-screen w-full flex overflow-hidden">
            <DashboardSidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full">
              <DashboardHeader
                creditBalance={creditBalance}
                userName={userName}
                userEmail={user?.email || undefined}
              />
              <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-12">
                <div className="border-b border-border pb-6">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Billing & Subscription
                  </h1>
                  <p className="text-sm text-muted mt-1">
                    Manage your active plan, credit allocations, and payment methods.
                  </p>
                </div>

                {/* Authenticated Billing Dashboard */}
                <BillingDashboard
                  subscription={billingData?.subscription || null}
                  wallet={billingData?.wallet || null}
                  transactions={billingData?.transactions || []}
                />

                {/* Pricing Plans Presentation */}
                <div className="pt-8 border-t border-border">
                  <div className="text-center space-y-2 mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Change Subscription Plan</h2>
                    <p className="text-xs text-muted">
                      Upgrade or downgrade your engine capabilities anytime.
                    </p>
                  </div>
                  <PricingPresentation
                    plans={plans as unknown as PlanItem[]}
                    currentPlanKey={currentPlanKey}
                    isAuthenticated={true}
                  />
                </div>
              </main>
            </div>
          </div>
        ) : (
          <>
            <Navbar />
            <main className="flex-1 pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
              <div className="text-center space-y-4 max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                  Simple, Transparent <span className="text-gradient-accent">Pricing</span>
                </h1>
                <p className="text-base text-muted leading-relaxed">
                  Choose the engine tier that matches your creative workflow. Scale credits up or down with zero lock-in contracts.
                </p>
              </div>

              <PricingPresentation
                plans={plans as unknown as PlanItem[]}
                currentPlanKey="FREE"
                isAuthenticated={false}
              />
            </main>
            <Footer />
          </>
        )}
      </div>
    </ToastProvider>
  );
}
