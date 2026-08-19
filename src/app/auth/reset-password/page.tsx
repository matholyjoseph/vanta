"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, KeyRound, CheckCircle2, Clapperboard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCanvas } from "@/components/auth/auth-canvas";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { resetPasswordAction } from "@/app/actions/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const { showToast } = useToast();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      await resetPasswordAction({
        token,
        email,
        password,
        confirmPassword,
      });

      setIsSuccess(true);
      showToast("Password reset successfully!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password.";
      setErrorMsg(msg);
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
          Set new password
        </h1>
        <p className="text-sm text-muted">
          Enter a new password for account <span className="text-foreground font-mono">{email || "your account"}</span>.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="p-6 rounded-2xl border border-accent/30 bg-accent/5 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-foreground font-sans">
            Password updated successfully!
          </p>
          <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-xs">
            <Link href="/auth/login">Sign In with New Password</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted uppercase">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full h-11 pl-3.5 pr-10 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted uppercase">Confirm New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="w-full h-11 px-3.5 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent disabled:opacity-50"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !token}
            className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-sm shadow-md cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting Password...
              </>
            ) : (
              <>
                Reset Password <KeyRound className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen w-full bg-background text-foreground grid grid-cols-1 lg:grid-cols-2">
        <AuthCanvas />
        <div className="flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          <React.Suspense fallback={<div className="text-xs font-mono text-muted">Loading...</div>}>
            <ResetPasswordForm />
          </React.Suspense>
        </div>
      </div>
    </ToastProvider>
  );
}
