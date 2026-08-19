"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  forgotHref?: string;
  onForgotClick?: () => void;
}

export const PasswordField = React.forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(({ className, label = "PASSWORD", error, onForgotClick, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted font-mono">
          {label}
        </label>
        {onForgotClick && (
          <button
            type="button"
            onClick={onForgotClick}
            className="text-[11px] font-mono text-accent hover:underline focus:outline-none"
          >
            Forgot?
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className={cn(
            "flex h-11 w-full rounded-md border border-border bg-white px-3.5 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-accent disabled:cursor-not-allowed disabled:opacity-50 pr-10 transition-colors",
            error && "border-destructive focus:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black focus:outline-none transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
});

PasswordField.displayName = "PasswordField";
