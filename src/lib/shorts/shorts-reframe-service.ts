export type ReframeMode =
  | "CENTER_CROP"
  | "AUTO_REFRAME"
  | "SPLIT_LAYOUT"
  | "BLURRED_BACKGROUND";

export interface ReframeConfig {
  mode: ReframeMode;
  targetAspectRatio: string; // "9:16"
  targetWidth: number; // 1080
  targetHeight: number; // 1920
  cropKeyframes: Array<{
    time: number;
    cropX: number;
    cropY: number;
    scale: number;
  }>;
}

export class ShortsReframeService {
  public computeReframe(
    mode: ReframeMode = "AUTO_REFRAME",
    sourceDuration: number = 30
  ): ReframeConfig {
    const keyframes: ReframeConfig["cropKeyframes"] = [];

    if (mode === "AUTO_REFRAME") {
      // Smooth tracking keyframes over duration
      keyframes.push({ time: 0, cropX: 0.5, cropY: 0.5, scale: 1.0 });
      if (sourceDuration > 10) {
        keyframes.push({ time: sourceDuration / 2, cropX: 0.45, cropY: 0.5, scale: 1.05 });
      }
      keyframes.push({ time: sourceDuration, cropX: 0.5, cropY: 0.5, scale: 1.0 });
    } else {
      // Static center crop
      keyframes.push({ time: 0, cropX: 0.5, cropY: 0.5, scale: 1.0 });
    }

    return {
      mode,
      targetAspectRatio: "9:16",
      targetWidth: 1080,
      targetHeight: 1920,
      cropKeyframes: keyframes,
    };
  }
}

export const shortsReframeService = new ShortsReframeService();
