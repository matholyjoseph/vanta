"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { ForgotModal } from "@/components/auth/forgot-modal";
import { OnboardingWizard } from "@/components/auth/onboarding-wizard";
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validations/auth";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode state: 'signin' | 'signup'
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = React.useState<"signin" | "signup">(initialMode);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [createdUserId, setCreatedUserId] = React.useState<string | undefined>();
  const [forgotOpen, setForgotOpen] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  // Sign In Form
  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  // Sign Up Form
  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // Handle Tab Switch
  const switchMode = (newMode: "signin" | "signup") => {
    setMode(newMode);
    setAuthError(null);
    signInForm.reset();
    signUpForm.reset();
  };

  // Sign In Submission
  const onSignInSubmit = async (data: SignInInput) => {
    setAuthError(null);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        setAuthError("Invalid email or password. Please check your credentials.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setAuthError("An unexpected authentication error occurred.");
    }
  };

  // Sign Up Submission
  const onSignUpSubmit = async (data: SignUpInput) => {
    setAuthError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setAuthError(result.error || "Failed to create account.");
        return;
      }

      // Store created user reference
      if (result.user?.id) {
        setCreatedUserId(result.user.id);
      }

      // Auto sign in user after registration
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      // Show onboarding wizard
      setShowOnboarding(true);
    } catch {
      setAuthError("Network error. Please try again later.");
    }
  };

  if (showOnboarding) {
    return (
      <OnboardingWizard
        userId={createdUserId}
        onComplete={() => {
          router.push("/dashboard");
          router.refresh();
        }}
      />
    );
  }

  const isSubmitting =
    mode === "signin"
      ? signInForm.formState.isSubmitting
      : signUpForm.formState.isSubmitting;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome to Vanta
        </h1>
        <p className="text-sm text-muted">
          Sign in or create an account to continue.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="border-b border-border/80 flex gap-8">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`pb-3 text-xs font-mono font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            mode === "signin" ? "text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          SIGN IN
          {mode === "signin" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>

        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`pb-3 text-xs font-mono font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            mode === "signup" ? "text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          CREATE ACCOUNT
          {mode === "signup" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      </div>

      {/* Global Auth Error Alert */}
      {authError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3.5 text-xs text-destructive flex items-center justify-between">
          <span>{authError}</span>
          <button
            onClick={() => setAuthError(null)}
            className="text-destructive font-bold ml-2 hover:opacity-80"
          >
            ×
          </button>
        </div>
      )}

      {/* SIGN IN FORM */}
      {mode === "signin" ? (
        <form
          onSubmit={signInForm.handleSubmit(onSignInSubmit)}
          className="space-y-5"
        >
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              disabled={isSubmitting}
              {...signInForm.register("email")}
              className={`flex h-11 w-full rounded-md border border-border bg-white px-3.5 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-accent transition-colors ${
                signInForm.formState.errors.email ? "border-destructive" : ""
              }`}
            />
            {signInForm.formState.errors.email && (
              <p className="text-xs text-destructive mt-1">
                {signInForm.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <PasswordField
            disabled={isSubmitting}
            onForgotClick={() => setForgotOpen(true)}
            {...signInForm.register("password")}
            error={signInForm.formState.errors.password?.message}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent-hover font-semibold text-sm transition-all shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      ) : (
        /* CREATE ACCOUNT FORM */
        <form
          onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}
          className="space-y-5"
        >
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              disabled={isSubmitting}
              {...signUpForm.register("email")}
              className={`flex h-11 w-full rounded-md border border-border bg-white px-3.5 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-accent transition-colors ${
                signUpForm.formState.errors.email ? "border-destructive" : ""
              }`}
            />
            {signUpForm.formState.errors.email && (
              <p className="text-xs text-destructive mt-1">
                {signUpForm.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <PasswordField
            disabled={isSubmitting}
            {...signUpForm.register("password")}
            error={signUpForm.formState.errors.password?.message}
          />

          {/* Confirm Password */}
          <PasswordField
            label="CONFIRM PASSWORD"
            disabled={isSubmitting}
            {...signUpForm.register("confirmPassword")}
            error={signUpForm.formState.errors.confirmPassword?.message}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent-hover font-semibold text-sm transition-all shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Account <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/80" />
        </div>
        <div className="relative px-3 bg-background text-[10px] font-mono uppercase tracking-widest text-muted">
          OR
        </div>
      </div>

      {/* OAuth Options */}
      <OAuthButtons isLoading={isSubmitting} />

      {/* Forgot Password Dialog */}
      <ForgotModal open={forgotOpen} onOpenChange={setForgotOpen} />
    </div>
  );
}
