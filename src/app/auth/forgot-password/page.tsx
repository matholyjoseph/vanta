"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Send, CheckCircle2, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCanvas } from "@/components/auth/auth-canvas";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { requestPasswordResetAction } from "@/app/actions/auth";

function ForgotPasswordForm() {
  const { showToast } = useToast();
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [confirmationMsg, setConfirmationMsg] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      const res = await requestPasswordResetAction({ email });
      setIsSubmitted(true);
      setConfirmationMsg(res.message);
      showToast("Reset instructions request sent.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process request.";
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Mobile Top Brand Header */}
      <div className="lg:hidden text-center space-y-2 mb-6">
        <Link href="/" className="inline-flex items-center space-x-2">
          <Clapperboard className="h-8 w-8 rotate-12 text-accent" />
          <span className="font-bold text-2xl text-foreground">Vanta AI</span>
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Reset password
        </h1>
        <p className="text-sm text-muted">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      {isSubmitted ? (
        <div className="p-6 rounded-2xl border border-accent/30 bg-accent/5 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-xs text-foreground leading-relaxed font-sans">
            {confirmationMsg}
          </p>
          <Button asChild variant="outline" className="w-full text-xs font-mono border-border">
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Return to Sign In
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted uppercase">Email Address</label>
            <input
              type="email"
              required
              placeholder="creator@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full h-11 px-3.5 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent disabled:opacity-50"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-sm shadow-md cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                Send Reset Link <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}

      <div className="text-center pt-2">
        <Link
          href="/auth/login"
          className="inline-flex items-center text-xs font-mono text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen w-full bg-background text-foreground grid grid-cols-1 lg:grid-cols-2">
        <AuthCanvas />
        <div className="flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          <ForgotPasswordForm />
        </div>
      </div>
    </ToastProvider>
  );
}
