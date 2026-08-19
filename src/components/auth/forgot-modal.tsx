"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { checkEmailExistsAction } from "@/app/actions/auth";

interface ForgotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotModal({ open, onOpenChange }: ForgotModalProps) {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      // Architecture hook for password reset token generation
      await checkEmailExistsAction(email);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setEmail("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Reset Password
          </DialogTitle>
          <DialogDescription className="text-muted text-sm mt-1">
            Enter your account email to receive a password reset link.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              ✓
            </div>
            <p className="text-sm text-foreground">
              If an account exists for <span className="font-semibold text-accent">{email}</span>, a password reset link has been sent.
            </p>
            <Button onClick={handleReset} className="w-full bg-accent text-accent-foreground mt-4">
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-md border border-border bg-white px-3.5 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/80"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent text-accent-foreground font-semibold"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
