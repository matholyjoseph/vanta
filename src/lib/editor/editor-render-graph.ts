import { EditorTimelineState, TimelineClip } from "@/lib/editor/editor-types";

export interface RenderJobInstruction {
  projectId: string;
  outputResolution: string;
  aspectRatio: string;
  fps: number;
  canvasWidth: number;
  canvasHeight: number;
  videoClips: Array<{
    sourceUrl: string;
    sourceIn: number;
    sourceOut: number;
    timelineStart: number;
    timelineDuration: number;
    speed: number;
    transforms: any;
  }>;
  audioClips: Array<{
    sourceUrl: string;
    sourceIn: number;
    sourceOut: number;
    timelineStart: number;
    volume: number;
    fadeIn: number;
    fadeOut: number;
    type: string;
  }>;
  textLayers: Array<any>;
  captions: Array<any>;
}

export class EditorRenderGraphService {
  public buildRenderJob(state: EditorTimelineState): RenderJobInstruction {
    const videoClips: RenderJobInstruction["videoClips"] = [];
    const audioClips: RenderJobInstruction["audioClips"] = [];
    const textLayers: RenderJobInstruction["textLayers"] = [];

    for (const track of state.tracks) {
      if (track.hidden || track.muted) continue;

      if (track.type === "VIDEO" || track.type === "IMAGE" || track.type === "OVERLAY") {
        for (const clip of track.clips) {
          videoClips.push({
            sourceUrl: clip.sourceUrl,
            sourceIn: clip.sourceIn,
            sourceOut: clip.sourceOut,
            timelineStart: clip.timelineStart,
            timelineDuration: clip.timelineDuration,
            speed: clip.speed,
            transforms: clip.transforms,
          });
        }
      } else if (
        track.type === "DIALOGUE" ||
        track.type === "VOICEOVER" ||
        track.type === "MUSIC" ||
        track.type === "SFX"
      ) {
        for (const clip of track.clips) {
          audioClips.push({
            sourceUrl: clip.sourceUrl,
            sourceIn: clip.sourceIn,
            sourceOut: clip.sourceOut,
            timelineStart: clip.timelineStart,
            volume: clip.volume * track.volume,
            fadeIn: clip.fadeIn,
            fadeOut: clip.fadeOut,
            type: track.type,
          });
        }
      }

      for (const tl of track.textLayers) {
        textLayers.push(tl);
      }
    }

    // Sort video clips by timeline start
    videoClips.sort((a, b) => a.timelineStart - b.timelineStart);

    return {
      projectId: state.projectId,
      outputResolution: state.aspectRatio === "9:16" ? "1080x1920" : "1920x1080",
      aspectRatio: state.aspectRatio,
      fps: state.fps,
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      videoClips,
      audioClips,
      textLayers,
      captions: state.captionSegments,
    };
  }
}

export const editorRenderGraph = new EditorRenderGraphService();
