import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().default("vanta_default_auth_secret_dev_key_2026"),
  APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  REDIS_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnvironment(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Environment validation error:", result.error.format());
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: Environment validation failed in production.");
    }
  }
  return result.data || (process.env as any);
}

export const env = validateEnvironment();
