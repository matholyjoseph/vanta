import { z } from "zod";

// --- CREATIVE BRIEF SCHEMA ---
export const creativeBriefSchema = z.object({
  title: z.string().default("Untitled Production"),
  projectType: z.string().default("Commercial"), // Commercial, Movie Trailer, Short Film, Music Video, TikTok, Presenter, etc.
  objective: z.string().default("Promotional video content"),
  targetAudience: z.string().default("General Audience"),
  duration: z.string().default("30s"),
  aspectRatio: z.string().default("16:9"),
  resolutionPreference: z.string().default("1080p"),
  visualStyle: z.string().default("Cinematic Realism"),
  tone: z.string().default("Sophisticated & Dramatic"),
  pacing: z.string().default("Dynamic"),
  locationPreferences: z.array(z.string()).default([]),
  characters: z.array(z.object({
    name: z.string(),
    description: z.string(),
    role: z.string().default("Lead"),
  })).default([]),
  products: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).default([]),
  voiceover: z.object({
    enabled: z.boolean().default(true),
    voiceGender: z.string().default("Female"),
    tone: z.string().default("Sophisticated"),
    language: z.string().default("en"),
  }).default({ enabled: true, voiceGender: "Female", tone: "Sophisticated", language: "en" }),
  music: z.object({
    enabled: z.boolean().default(true),
    genre: z.string().default("Cinematic Orchestral"),
    mood: z.string().default("Dramatic"),
  }).default({ enabled: true, genre: "Cinematic Orchestral", mood: "Dramatic" }),
  soundDesign: z.array(z.string()).default([]),
  platform: z.string().default("GENERIC"),
  qualityPreference: z.enum(["ECONOMY", "BALANCED", "PREMIUM"]).default("BALANCED"),
  budgetPreference: z.enum(["USE_AVAILABLE", "MAX_CREDITS", "ASK"]).default("ASK"),
  specialInstructions: z.string().optional(),
});

export type CreativeBrief = z.infer<typeof creativeBriefSchema>;

// --- PLANNED SHOT SCHEMA ---
export const plannedShotSchema = z.object({
  shotNumber: z.string(),
  sceneIndex: z.number(),
  purpose: z.string(),
  prompt: z.string(),
  storyboardPrompt: z.string(),
  shotSize: z.string().default("Medium Shot"),
  cameraAngle: z.string().default("Eye Level"),
  cameraMovement: z.string().default("Static"),
  lens: z.string().default("35mm"),
  duration: z.string().default("5s"),
  generationMode: z.string().default("text-to-video"),
  recommendedModelId: z.string().default("vanta-motion-fast"),
  dialogueLine: z.string().optional(),
  speaker: z.string().optional(),
  audioEffect: z.string().optional(),
});

export type PlannedShot = z.infer<typeof plannedShotSchema>;

// --- PLANNED SCENE SCHEMA ---
export const plannedSceneSchema = z.object({
  sceneIndex: z.number(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  timeOfDay: z.string().default("Day"),
  shots: z.array(plannedShotSchema),
});

export type PlannedScene = z.infer<typeof plannedSceneSchema>;

// --- DIRECTOR PLAN SCHEMA ---
export const directorPlanSchema = z.object({
  title: z.string(),
  creativeBrief: creativeBriefSchema,
  scriptText: z.string(),
  scenes: z.array(plannedSceneSchema),
  characters: z.array(z.object({
    name: z.string(),
    description: z.string(),
    prompt: z.string(),
  })).default([]),
  locations: z.array(z.object({
    name: z.string(),
    description: z.string(),
    prompt: z.string(),
  })).default([]),
  products: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).default([]),
  voiceoverScript: z.string().optional(),
  voiceId: z.string().default("voice-maya"),
  musicPrompt: z.string().default("Cinematic ambient score"),
  sfxPrompts: z.array(z.string()).default([]),
  modelAssignments: z.object({
    imageModel: z.string().default("fal-flux-schnell"),
    videoModel: z.string().default("vanta-motion-fast"),
    audioModel: z.string().default("fal-mmaudio"),
    avatarModel: z.string().default("fal-latentsync"),
  }),
  estimatedCredits: z.number(),
  totalDurationSeconds: z.number(),
});

export type DirectorPlan = z.infer<typeof directorPlanSchema>;

// --- DIRECTOR TEMPLATE INTERFACE ---
export interface DirectorTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  suggestedPrompt: string;
  defaultDuration: string;
  defaultAspectRatio: string;
  defaultPlatform: string;
}
