import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .transform((val) => val.trim().toLowerCase()),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Full Name must be at least 2 characters long" })
      .max(80, { message: "Full Name cannot exceed 80 characters" }),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Please enter a valid email address" })
      .transform((val) => val.trim().toLowerCase()),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Terms of Service and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .transform((val) => val.trim().toLowerCase()),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const onboardingSchema = z.object({
  creatorTypes: z.array(z.string()).min(1, { message: "Please select at least one option" }),
  firstCreationType: z.string().min(1, { message: "Please select what you want to create first" }),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"], {
    message: "Please select a valid aspect ratio",
  }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export function getSafeCallbackUrl(rawUrl?: string | string[] | null): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    return "/dashboard";
  }

  const trimmed = rawUrl.trim();

  // Allow internal relative paths (e.g. /dashboard, /studio/video, /projects)
  // Prevent protocol-relative URLs (e.g. //evil.com or /\evil.com)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return trimmed;
  }

  // If full URL, verify origin match
  try {
    const parsed = new URL(trimmed);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "https://vantaaii.vercel.app";
    const appOrigin = new URL(appUrl).origin;
    if (parsed.origin === appOrigin) {
      return parsed.pathname + parsed.search;
    }
  } catch {}

  return "/dashboard";
}
