import {
  EditorTimelineState,
  TimelineClip,
  TimelineTrack,
  Transition,
  TextLayer,
  CaptionSegment,
  Keyframe,
  KeyframeProperty,
} from "@/lib/editor/editor-types";

export class EditorStateManager {
  private state: EditorTimelineState;
  private undoStack: EditorTimelineState[] = [];
  private redoStack: EditorTimelineState[] = [];

  constructor(initialState: EditorTimelineState) {
    this.state = JSON.parse(JSON.stringify(initialState));
  }

  public getState(): EditorTimelineState {
    return JSON.parse(JSON.stringify(this.state));
  }

  private pushUndoState() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.state)));
    this.redoStack = []; // Clear redo on new action
  }

  public undo(): EditorTimelineState | null {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(JSON.parse(JSON.stringify(this.state)));
    this.state = this.undoStack.pop()!;
    return this.getState();
  }

  public redo(): EditorTimelineState | null {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(JSON.parse(JSON.stringify(this.state)));
    this.state = this.redoStack.pop()!;
    return this.getState();
  }

  // 1. Add Clip to Track (Non-destructive)
  public addClipToTrack(trackId: string, clipData: Partial<TimelineClip>): EditorTimelineState {
    this.pushUndoState();
    const track = this.state.tracks.find((t) => t.id === trackId);
    if (!track) return this.getState();

    const newClip: TimelineClip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      trackId,
      name: clipData.name || "New Clip",
      sourceAssetId: clipData.sourceAssetId,
      sourceUrl: clipData.sourceUrl || "",
      thumbnailUrl: clipData.thumbnailUrl,
      mimeType: clipData.mimeType || "video/mp4",
      sourceIn: clipData.sourceIn || 0,
      sourceOut: clipData.sourceOut || 5,
      timelineStart: clipData.timelineStart || 0,
      timelineDuration: clipData.timelineDuration || 5,
      speed: clipData.speed || 1.0,
      volume: clipData.volume || 1.0,
      fadeIn: 0,
      fadeOut: 0,
      muted: false,
      transforms: clipData.transforms || {
        positionX: 0,
        positionY: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        cropLeft: 0,
        cropRight: 0,
        cropTop: 0,
        cropBottom: 0,
      },
      effects: [],
      keyframes: [],
    };

    track.clips.push(newClip);
    this.recalculateTotalDuration();
    return this.getState();
  }

  // 2. Split Clip at Playhead (S Key)
  public splitClipAtPlayhead(clipId: string, playheadTime: Float32Array | number): EditorTimelineState {
    const pTime = typeof playheadTime === "number" ? playheadTime : playheadTime[0];

    let targetTrack: TimelineTrack | null = null;
    let targetClipIndex = -1;

    for (const t of this.state.tracks) {
      const idx = t.clips.findIndex((c) => c.id === clipId);
      if (idx !== -1) {
        targetTrack = t;
        targetClipIndex = idx;
        break;
      }
    }

    if (!targetTrack || targetClipIndex === -1) return this.getState();

    const originalClip = targetTrack.clips[targetClipIndex];

    // Check if playhead is strictly inside clip timeline bounds
    if (pTime <= originalClip.timelineStart || pTime >= originalClip.timelineStart + originalClip.timelineDuration) {
      return this.getState();
    }

    this.pushUndoState();

    const splitOffset = pTime - originalClip.timelineStart; // Time in seconds from clip start
    const sourceSplitOffset = splitOffset * originalClip.speed;

    // First Part (Clip 1)
    const clip1Duration = splitOffset;
    originalClip.timelineDuration = clip1Duration;
    originalClip.sourceOut = originalClip.sourceIn + sourceSplitOffset;

    // Second Part (Clip 2)
    const clip2SourceIn = originalClip.sourceOut;
    const clip2Duration = (originalClip.sourceOut - clip2SourceIn) / originalClip.speed;

    const clip2: TimelineClip = {
      ...JSON.parse(JSON.stringify(originalClip)),
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sourceIn: clip2SourceIn,
      timelineStart: pTime,
      timelineDuration: clip2Duration,
    };

    targetTrack.clips.splice(targetClipIndex + 1, 0, clip2);
    return this.getState();
  }

  // 3. Trim Clip Boundaries (Non-destructive)
  public trimClip(clipId: string, newIn: number, newOut: number, newStart: number): EditorTimelineState {
    this.pushUndoState();

    for (const t of this.state.tracks) {
      const clip = t.clips.find((c) => c.id === clipId);
      if (clip) {
        clip.sourceIn = Math.max(0, newIn);
        clip.sourceOut = Math.max(clip.sourceIn + 0.1, newOut);
        clip.timelineStart = Math.max(0, newStart);
        clip.timelineDuration = (clip.sourceOut - clip.sourceIn) / clip.speed;
        break;
      }
    }

    this.recalculateTotalDuration();
    return this.getState();
  }

  // 4. Delete Clip
  public deleteClip(clipId: string): EditorTimelineState {
    this.pushUndoState();

    for (const t of this.state.tracks) {
      t.clips = t.clips.filter((c) => c.id !== clipId);
      t.textLayers = t.textLayers.filter((tl) => tl.id !== clipId);
    }

    this.state.transitions = this.state.transitions.filter(
      (tr) => tr.fromClipId !== clipId && tr.toClipId !== clipId
    );

    this.recalculateTotalDuration();
    return this.getState();
  }

  // 5. Add Keyframe
  public addKeyframe(clipId: string, property: KeyframeProperty, time: number, value: number): EditorTimelineState {
    this.pushUndoState();

    for (const t of this.state.tracks) {
      const clip = t.clips.find((c) => c.id === clipId);
      if (clip) {
        clip.keyframes = clip.keyframes.filter((k) => !(k.property === property && Math.abs(k.time - time) < 0.05));
        clip.keyframes.push({
          id: `kf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          property,
          time,
          value,
          easing: "LINEAR",
        });
        clip.keyframes.sort((a, b) => a.time - b.time);
        break;
      }
    }

    return this.getState();
  }

  // 6. Recalculate Total Duration
  private recalculateTotalDuration() {
    let maxTime = 10;
    for (const t of this.state.tracks) {
      for (const c of t.clips) {
        maxTime = Math.max(maxTime, c.timelineStart + c.timelineDuration);
      }
      for (const tl of t.textLayers) {
        maxTime = Math.max(maxTime, tl.timelineStart + tl.timelineDuration);
      }
    }
    this.state.totalDuration = Math.ceil(maxTime);
  }
}
