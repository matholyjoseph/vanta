import { db } from "@/lib/db";
import { submitImageGenerationAction } from "@/app/actions/image-actions";
import { submitAudioGenerationAction } from "@/app/actions/audio-actions";
import { submitAvatarGenerationAction } from "@/app/actions/avatar-actions";
import { submitGenerationAction } from "@/app/actions/generation";
import {
  createCinemaProjectAction,
  createSceneAction,
  createShotAction,
  generateStoryboardForShotAction,
  generateVideoForShotAction,
  exportFilmAction,
} from "@/app/actions/cinema-actions";

export interface DirectorToolDefinition {
  name: string;
  description: string;
  costProducing: boolean;
  execute: (input: any, context: { userId: string; runId: string; projectId?: string }) => Promise<any>;
}

export class DirectorToolRegistryService {
  private tools: Map<string, DirectorToolDefinition> = new Map();

  constructor() {
    this.registerTools();
  }

  private registerTools() {
    // 1. Create Cinema Project
    this.tools.set("createProject", {
      name: "createProject",
      description: "Create a new Cinema Project workspace for multi-scene film production.",
      costProducing: false,
      execute: async (input, ctx) => {
        return createCinemaProjectAction({
          name: input.name || "AI Director Production",
          description: input.description || "Orchestrated by VANTA AI Director",
          aspectRatio: input.aspectRatio || "16:9",
          creditBudget: input.creditBudget || 1000,
        });
      },
    });

    // 2. Generate Reference Image (Image Studio)
    this.tools.set("generateImage", {
      name: "generateImage",
      description: "Generate reference image or asset using Image Studio engine.",
      costProducing: true,
      execute: async (input) => {
        return submitImageGenerationAction({
          modelId: input.modelId || "fal-flux-schnell",
          mode: input.mode || "text-to-image",
          prompt: input.prompt,
          aspectRatio: input.aspectRatio || "16:9",
          resolution: input.resolution || "1080p",
        });
      },
    });

    // 3. Generate Storyboard Frame
    this.tools.set("generateStoryboard", {
      name: "generateStoryboard",
      description: "Generate visual storyboard illustration for a specific shot.",
      costProducing: true,
      execute: async (input) => {
        return generateStoryboardForShotAction(input.shotId);
      },
    });

    // 4. Generate Video Take
    this.tools.set("generateVideo", {
      name: "generateVideo",
      description: "Submit video render for shot take using Video Studio engine.",
      costProducing: true,
      execute: async (input) => {
        if (input.shotId) {
          return generateVideoForShotAction(input.shotId, input.modelId);
        }
        return submitGenerationAction({
          modelId: input.modelId || "vanta-motion-fast",
          mode: input.mode || "text-to-video",
          prompt: input.prompt,
          resolution: input.resolution || "1080p",
          duration: input.duration || "5s",
          aspectRatio: input.aspectRatio || "16:9",
          fps: 24,
        });
      },
    });

    // 5. Generate Voiceover / Speech (Audio Studio)
    this.tools.set("generateVoice", {
      name: "generateVoice",
      description: "Synthesize natural text-to-speech voiceover script using Audio Studio.",
      costProducing: true,
      execute: async (input) => {
        return submitAudioGenerationAction({
          modelId: input.modelId || "fal-mmaudio",
          mode: "text-to-speech",
          prompt: input.script || input.prompt,
          script: input.script || input.prompt,
          voiceId: input.voiceId || "voice-maya",
          duration: input.duration || "15s",
        });
      },
    });

    // 6. Generate Music Track
    this.tools.set("generateMusic", {
      name: "generateMusic",
      description: "Synthesize cinematic score / background music using Audio Studio.",
      costProducing: true,
      execute: async (input) => {
        return submitAudioGenerationAction({
          modelId: input.modelId || "fal-mmaudio",
          mode: "music",
          prompt: input.prompt || "Cinematic orchestral score",
          duration: input.duration || "30s",
        });
      },
    });

    // 7. Generate Sound Effect (SFX)
    this.tools.set("generateSoundEffect", {
      name: "generateSoundEffect",
      description: "Synthesize cinematic sound effect using Audio Studio.",
      costProducing: true,
      execute: async (input) => {
        return submitAudioGenerationAction({
          modelId: input.modelId || "fal-mmaudio",
          mode: "sound-effects",
          prompt: input.prompt || "Cinematic whoosh sound effect",
          duration: "5s",
        });
      },
    });

    // 8. Generate Talking Avatar / Lip Sync
    this.tools.set("generateAvatar", {
      name: "generateAvatar",
      description: "Synchronize mouth movement and speech using Avatar Studio.",
      costProducing: true,
      execute: async (input) => {
        return submitAvatarGenerationAction({
          modelId: input.modelId || "fal-latentsync",
          mode: input.mode || "talking-avatar",
          portraitImageUrl: input.portraitImageUrl,
          sourceVideoUrl: input.sourceVideoUrl,
          audioUrl: input.audioUrl,
          scriptText: input.scriptText,
          consentConfirmed: true,
        });
      },
    });

    // 9. Export Final Film MP4
    this.tools.set("exportFilm", {
      name: "exportFilm",
      description: "Render and export compiled Cinema project film to persistent storage.",
      costProducing: true,
      execute: async (input) => {
        return exportFilmAction(input.projectId);
      },
    });
  }

  public getTool(name: string): DirectorToolDefinition | undefined {
    return this.tools.get(name);
  }
}

export const directorToolRegistry = new DirectorToolRegistryService();
