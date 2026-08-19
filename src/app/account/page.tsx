import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ToastProvider } from "@/components/ui/toast";
import { AccountClient } from "@/components/account/account-client";

export const metadata: Metadata = {
  title: "Account Settings — Vanta AI",
  description: "Manage your Vanta AI profile, security settings, and preferences.",
};

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id && !session?.user?.email) {
    redirect("/auth/login?callbackUrl=/account");
  }

  let user = null;
  if (session?.user?.id) {
    user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        preference: true,
        creditWallet: true,
      },
    });
  }

  if (!user && session?.user?.email) {
    user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        preference: true,
        creditWallet: true,
      },
    });
  }

  if (!user) {
    redirect("/auth/login?callbackUrl=/account");
  }

  return (
    <ToastProvider>
      <div className="h-screen w-full bg-background text-foreground flex overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <DashboardHeader
            creditBalance={user.creditWallet?.balance ?? 2450}
            userName={user.name || "Creator"}
            userEmail={user.email || undefined}
          />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            <div className="border-b border-border pb-6 max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Account Settings
              </h1>
              <p className="text-sm text-muted mt-1">
                Manage your personal profile, security credentials, and studio preferences.
              </p>
            </div>

            <AccountClient
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
              }}
              preference={user.preference}
            />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
