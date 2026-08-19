import { z } from "zod";

// Track Types
export type TrackType =
  | "VIDEO"
  | "IMAGE"
  | "OVERLAY"
  | "TEXT"
  | "CAPTIONS"
  | "DIALOGUE"
  | "VOICEOVER"
  | "MUSIC"
  | "SFX"
  | "ADJUSTMENT";

// Keyframe Property
export type KeyframeProperty =
  | "positionX"
  | "positionY"
  | "scale"
  | "rotation"
  | "opacity"
  | "volume";

// Keyframe Schema
export const keyframeSchema = z.object({
  id: z.string(),
  property: z.enum(["positionX", "positionY", "scale", "rotation", "opacity", "volume"]),
  time: z.number(), // Seconds relative to clip start
  value: z.number(),
  easing: z.enum(["LINEAR", "EASE_IN", "EASE_OUT", "EASE_IN_OUT"]).default("LINEAR"),
});

export type Keyframe = z.infer<typeof keyframeSchema>;

// Effect Instance Schema
export const effectInstanceSchema = z.object({
  id: z.string(),
  type: z.enum(["brightness", "contrast", "saturation", "temperature", "exposure", "blur", "vignette", "bw", "sharpen"]),
  enabled: z.boolean().default(true),
  parameters: z.record(z.string(), z.any()).default({}),
});

export type EffectInstance = z.infer<typeof effectInstanceSchema>;

// Clip Transform Schema
export const clipTransformSchema = z.object({
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  scale: z.number().default(1),
  rotation: z.number().default(0),
  opacity: z.number().default(1),
  cropLeft: z.number().default(0),
  cropRight: z.number().default(0),
  cropTop: z.number().default(0),
  cropBottom: z.number().default(0),
});

export type ClipTransform = z.infer<typeof clipTransformSchema>;

// Timeline Clip Schema (Non-destructive)
export const timelineClipSchema = z.object({
  id: z.string(),
  trackId: z.string(),
  name: z.string().default("Clip"),
  sourceAssetId: z.string().optional(),
  sourceUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  mimeType: z.string().default("video/mp4"),
  sourceIn: z.number().default(0), // Start point in original media (seconds)
  sourceOut: z.number().default(5), // End point in original media (seconds)
  timelineStart: z.number().default(0), // Position on NLE timeline (seconds)
  timelineDuration: z.number().default(5), // Active duration on timeline (seconds)
  speed: z.number().default(1.0), // 0.25x - 4.0x
  volume: z.number().default(1.0), // 0.0 - 2.0
  fadeIn: z.number().default(0), // Seconds
  fadeOut: z.number().default(0), // Seconds
  muted: z.boolean().default(false),
  transforms: clipTransformSchema.default({
    positionX: 0,
    positionY: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    cropLeft: 0,
    cropRight: 0,
    cropTop: 0,
    cropBottom: 0,
  }),
  effects: z.array(effectInstanceSchema).default([]),
  keyframes: z.array(keyframeSchema).default([]),
});

export type TimelineClip = z.infer<typeof timelineClipSchema>;

// Transition Schema
export const transitionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "CUT",
    "CROSS_DISSOLVE",
    "FADE_BLACK",
    "FADE_WHITE",
    "SLIDE_LEFT",
    "SLIDE_RIGHT",
    "PUSH",
    "ZOOM",
    "WIPE",
  ]).default("CROSS_DISSOLVE"),
  fromClipId: z.string(),
  toClipId: z.string(),
  duration: z.number().default(1.0), // Seconds
});

export type Transition = z.infer<typeof transitionSchema>;

// Text Layer Schema
export const textLayerSchema = z.object({
  id: z.string(),
  trackId: z.string(),
  text: z.string().default("Title Text"),
  fontFamily: z.string().default("Inter"),
  fontSize: z.number().default(48),
  fontWeight: z.string().default("700"),
  color: z.string().default("#ffffff"),
  backgroundColor: z.string().optional(),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  width: z.number().default(600),
  alignment: z.enum(["left", "center", "right"]).default("center"),
  animation: z.enum(["NONE", "FADE", "SLIDE_UP", "SLIDE_DOWN", "SCALE", "TYPEWRITER"]).default("FADE"),
  timelineStart: z.number().default(0),
  timelineDuration: z.number().default(5),
});

export type TextLayer = z.infer<typeof textLayerSchema>;

// Caption Segment Schema
export const captionSegmentSchema = z.object({
  id: z.string(),
  startTime: z.number(), // Seconds
  endTime: z.number(), // Seconds
  text: z.string(),
  speaker: z.string().optional(),
  stylePreset: z.enum(["CLEAN", "BOLD", "MINIMAL", "SUBTITLE", "SOCIAL"]).default("BOLD"),
});

export type CaptionSegment = z.infer<typeof captionSegmentSchema>;

// Track Schema
export const timelineTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    "VIDEO",
    "IMAGE",
    "OVERLAY",
    "TEXT",
    "CAPTIONS",
    "DIALOGUE",
    "VOICEOVER",
    "MUSIC",
    "SFX",
    "ADJUSTMENT",
  ]),
  muted: z.boolean().default(false),
  soloed: z.boolean().default(false),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
  volume: z.number().default(1.0),
  clips: z.array(timelineClipSchema).default([]),
  textLayers: z.array(textLayerSchema).default([]),
});

export type TimelineTrack = z.infer<typeof timelineTrackSchema>;

// Ducking Config
export const audioDuckingSchema = z.object({
  enabled: z.boolean().default(true),
  duckAmountDb: z.number().default(-12),
  attackMs: z.number().default(100),
  releaseMs: z.number().default(300),
});

export type AudioDuckingConfig = z.infer<typeof audioDuckingSchema>;

// Complete Editor State Schema
export const editorTimelineStateSchema = z.object({
  projectId: z.string(),
  fps: z.number().default(24),
  aspectRatio: z.string().default("16:9"),
  canvasWidth: z.number().default(1920),
  canvasHeight: z.number().default(1080),
  totalDuration: z.number().default(30),
  tracks: z.array(timelineTrackSchema).default([]),
  transitions: z.array(transitionSchema).default([]),
  captionSegments: z.array(captionSegmentSchema).default([]),
  duckingConfig: audioDuckingSchema.default({ enabled: true, duckAmountDb: -12, attackMs: 100, releaseMs: 300 }),
});

export type EditorTimelineState = z.infer<typeof editorTimelineStateSchema>;
