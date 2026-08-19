"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, ArrowRight, Clapperboard, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCanvas } from "@/components/auth/auth-canvas";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { signUpAction, continueAsGuestAction } from "@/app/actions/auth";
import { OnboardingWizard } from "@/components/auth/onboarding-wizard";

function SignUpForm() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [terms, setTerms] = React.useState(false);

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Errors & Onboarding State
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [duplicateEmailError, setDuplicateEmailError] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [createdUserId, setCreatedUserId] = React.useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: "", score: 0, color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-zA-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd) || pwd.length >= 12) score++;

    if (score <= 2) return { label: "Weak", score: 33, color: "bg-amber-500 text-amber-500" };
    if (score === 3) return { label: "Medium", score: 66, color: "bg-yellow-400 text-yellow-400" };
    return { label: "Strong", score: 100, color: "bg-emerald-400 text-emerald-400" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setFieldErrors({});
    setDuplicateEmailError(false);
    setIsLoading(true);

    try {
      const res = await signUpAction({
        name,
        email,
        password,
        confirmPassword,
        terms,
      });

      if (res.success && res.userId) {
        showToast("Account created successfully!", "success");
        setCreatedUserId(res.userId);

        // Sign in automatically in background
        await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });

        // Launch Onboarding Wizard
        setShowOnboarding(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account.";
      if (msg.includes("DUPLICATE_EMAIL")) {
        setDuplicateEmailError(true);
      } else {
        showToast(msg, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_ENABLED) {
      showToast("Google OAuth is disabled in development mode. Please sign up with email.", "error");
      return;
    }
    signIn("google", { callbackUrl: "/dashboard?onboarding=true" });
  };

  if (showOnboarding && createdUserId) {
    return (
      <div className="w-full max-w-lg mx-auto py-6">
        <OnboardingWizard
          userId={createdUserId}
          onComplete={() => {
            showToast("Welcome to Vanta AI Studio!", "success");
            router.push("/dashboard");
          }}
        />
      </div>
    );
  }

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
          Create your account
        </h1>
        <p className="text-sm text-muted">
          Start generating cinematic 4K AI videos with full commercial license.
        </p>
      </div>

      {/* Duplicate Email Banner */}
      {duplicateEmailError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-3 text-xs">
          <div className="flex items-start gap-2 text-destructive font-bold font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>An account with this email already exists.</span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-xs">
              <Link href="/auth/login">Sign In Instead</Link>
            </Button>
            <Link href="/auth/forgot-password" className="text-muted hover:text-foreground text-xs font-mono">
              Forgot password?
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted uppercase">Full Name</label>
          <input
            type="text"
            required
            placeholder="Alex Vance"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="w-full h-11 px-3.5 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        {/* Email Address */}
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

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted uppercase">Password</label>
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

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-1 pt-1">
              <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color.split(" ")[0]}`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-muted">Password Strength:</span>
                <span className={strength.color.split(" ")[1]}>{strength.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted uppercase">Confirm Password</label>
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

        {/* Terms Checkbox */}
        <div className="flex items-start space-x-2 pt-1">
          <input
            type="checkbox"
            id="terms"
            required
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent accent-[#c8ff00] cursor-pointer mt-0.5"
          />
          <label htmlFor="terms" className="text-xs text-muted leading-snug cursor-pointer select-none">
            I agree to the{" "}
            <Link href="/terms" className="text-foreground hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-foreground hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        {/* Create Account Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent-hover font-bold text-sm shadow-md cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
            </>
          ) : (
            <>
              Create Account <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-mono">
          <span className="bg-background px-3 text-muted">OR</span>
        </div>
      </div>

      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignUp}
        disabled={isLoading}
        className="w-full h-11 border-border bg-surface hover:bg-surface-hover text-foreground font-semibold text-xs justify-center cursor-pointer"
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </Button>

      {/* Footer Link */}
      <div className="text-center text-xs text-muted pt-2 font-sans space-y-3">
        <div>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-accent font-bold hover:underline">
            Sign In
          </Link>
        </div>

        <form action={continueAsGuestAction} className="pt-1 border-t border-border/60">
          <button
            type="submit"
            className="w-full text-amber-400 font-bold hover:underline font-mono text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            ⚡ Continue as Guest (Try Without Account) →
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen w-full bg-background text-foreground grid grid-cols-1 lg:grid-cols-2">
        <AuthCanvas />
        <div className="flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          <SignUpForm />
        </div>
      </div>
    </ToastProvider>
  );
}
