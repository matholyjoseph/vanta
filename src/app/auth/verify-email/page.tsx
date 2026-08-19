import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCanvas } from "@/components/auth/auth-canvas";

export const metadata: Metadata = {
  title: "Verify Email — Vanta AI",
  description: "Verify your Vanta AI account email address.",
};

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground grid grid-cols-1 lg:grid-cols-2">
      <AuthCanvas />
      <div className="flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Email Verified
            </h1>
            <p className="text-sm text-muted leading-relaxed font-sans">
              Your email address has been verified successfully. Your Vanta AI creator workspace is active and ready.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface text-xs font-mono text-muted flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>Development Verification Adapter Active</span>
          </div>

          <Button asChild className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-sm shadow-md">
            <Link href="/dashboard">
              Enter Workspace <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
