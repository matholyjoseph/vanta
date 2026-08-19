import { z } from "zod";

export const API_SCOPES = [
  "models:read",
  "generations:read",
  "generations:create",
  "generations:cancel",
  "assets:read",
  "assets:create",
  "director:read",
  "director:create",
  "webhooks:read",
  "webhooks:write",
  "usage:read",
] as const;

export type ApiScope = typeof API_SCOPES[number];

export const publicGenerationRequestSchema = z.object({
  model: z.string().default("vanta-cinema-pro"),
  mode: z.enum(["text-to-image", "text-to-video", "image-to-video", "text-to-speech", "talking-avatar"]).default("text-to-video"),
  prompt: z.string().min(1, "Prompt is required"),
  image_url: z.string().url().optional(),
  audio_url: z.string().url().optional(),
  duration: z.number().int().min(1).max(60).default(5),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1", "4:5"]).default("16:9"),
  resolution: z.enum(["720p", "1080p", "4k"]).default("1080p"),
  fps: z.number().default(24),
  webhook_url: z.string().url().optional(),
});

export type PublicGenerationRequest = z.infer<typeof publicGenerationRequestSchema>;

export const publicDirectorRunRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  automation_level: z.enum(["plan_only", "full_auto", "approval_required"]).default("plan_only"),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  max_credits: z.number().default(500),
});

export type PublicDirectorRunRequest = z.infer<typeof publicDirectorRunRequestSchema>;
