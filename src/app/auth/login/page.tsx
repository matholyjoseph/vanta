import * as React from "react";
import type { Metadata } from "next";
import { AuthCanvas } from "@/components/auth/auth-canvas";
import { ToastProvider } from "@/components/ui/toast";
import { LoginForm } from "@/components/auth/login-form";
import { getSafeCallbackUrl } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In — VANTA AI Studio",
  description: "Sign in to access your professional AI video workspace.",
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const safeCallbackUrl = getSafeCallbackUrl(query.callbackUrl);

  return (
    <ToastProvider>
      <div className="min-h-screen w-full bg-background text-foreground grid grid-cols-1 lg:grid-cols-2">
        <AuthCanvas />
        <div className="flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          <LoginForm callbackUrl={safeCallbackUrl} />
        </div>
      </div>
    </ToastProvider>
  );
}
