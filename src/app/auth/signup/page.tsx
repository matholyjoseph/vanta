import * as React from "react";
import type { Metadata } from "next";
import { AuthCanvas } from "@/components/auth/auth-canvas";
import { ToastProvider } from "@/components/ui/toast";
import { SignUpForm } from "@/components/auth/signup-form";
import { getSafeCallbackUrl } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Account — VANTA AI Studio",
  description: "Create your account to start generating 4K cinematic AI videos.",
};

interface SignUpPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const query = await searchParams;
  const safeCallbackUrl = getSafeCallbackUrl(query.callbackUrl);

  return (
    <ToastProvider>
      <div className="min-h-screen w-full bg-background text-foreground grid grid-cols-1 lg:grid-cols-2">
        <AuthCanvas />
        <div className="flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          <SignUpForm callbackUrl={safeCallbackUrl} />
        </div>
      </div>
    </ToastProvider>
  );
}
