import { z } from "zod";

export const transcriptSegmentSchema = z.object({
  id: z.string(),
  startTime: z.number(), // Seconds
  endTime: z.number(), // Seconds
  text: z.string(),
  speaker: z.string().default("Speaker 1"),
  confidence: z.number().default(0.95),
});

export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;

export const highlightCandidateSchema = z.object({
  id: z.string(),
  shortsProjectId: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  title: z.string(),
  summary: z.string(),
  suggestedHook: z.string(),
  score: z.number().default(85), // VANTA Highlight Score (0-100)
  reasonSummary: z.string(),
  category: z.enum(["INSIGHT", "HUMOR", "EMOTION", "STORY", "ACTION"]).default("INSIGHT"),
  status: z.enum(["SUGGESTED", "SELECTED", "DISMISSED"]).default("SUGGESTED"),
});

export type HighlightCandidate = z.infer<typeof highlightCandidateSchema>;

export const shortClipSchema = z.object({
  id: z.string(),
  shortsProjectId: z.string(),
  highlightCandidateId: z.string().optional(),
  name: z.string(),
  sourceStart: z.number(),
  sourceEnd: z.number(),
  duration: z.number(),
  status: z.enum(["READY", "PROCESSING", "EXPORTED", "FAILED"]).default("READY"),
  hookText: z.string().optional(),
  templateId: z.string().default("TALKING_HEAD"),
  reframeMode: z.enum(["CENTER_CROP", "AUTO_REFRAME", "SPLIT_LAYOUT", "BLURRED_BACKGROUND"]).default("AUTO_REFRAME"),
  cropKeyframes: z.array(z.object({
    time: z.number(),
    cropX: z.number(),
    cropY: z.number(),
    scale: z.number(),
  })).default([]),
  timelineStateId: z.string().optional(),
});

export type ShortClip = z.infer<typeof shortClipSchema>;

export interface ShortsChunk {
  chunkIndex: number;
  startTime: number;
  endTime: number;
  text: string;
  segments: TranscriptSegment[];
}
