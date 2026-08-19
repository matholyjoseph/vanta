"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EditorTopBar } from "@/components/editor/editor-top-bar";
import { EditorLeftPanel } from "@/components/editor/editor-left-panel";
import { EditorCanvasPreview } from "@/components/editor/editor-canvas-preview";
import { EditorInspectorPanel } from "@/components/editor/editor-inspector-panel";
import { EditorTimeline } from "@/components/editor/editor-timeline";
import { EditorStateManager } from "@/lib/editor/editor-state-manager";
import { EditorTimelineState, TimelineClip } from "@/lib/editor/editor-types";
import {
  saveEditorProjectStateAction,
  generateAutoCaptionsAction,
  renderAndExportEditorVideoAction,
} from "@/app/actions/editor-actions";
import { useToast } from "@/components/ui/toast";

export function EditorWorkspaceClient({
  initialProject,
  initialTimelineState,
  userAssets = [],
}: {
  initialProject: any;
  initialTimelineState: EditorTimelineState;
  userAssets: any[];
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const managerRef = React.useRef(new EditorStateManager(initialTimelineState));
  const [timelineState, setTimelineState] = React.useState<EditorTimelineState>(initialTimelineState);

  const [currentTime, setCurrentTime] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [selectedClipId, setSelectedClipId] = React.useState<string | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving" | "unsaved">("saved");
  const [previewQuality, setPreviewQuality] = React.useState("Auto");

  // Playback Timer
  React.useEffect(() => {
    let animFrame: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (isPlaying) {
        const delta = (now - lastTime) / 1000;
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= (timelineState.totalDuration || 30)) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }
      lastTime = now;
      if (isPlaying) animFrame = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      animFrame = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, timelineState.totalDuration]);

  // Debounced Autosave
  const triggerAutosave = React.useCallback(
    async (newState: EditorTimelineState) => {
      setSaveStatus("saving");
      try {
        await saveEditorProjectStateAction(initialProject.id, newState);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [initialProject.id]
  );

  const updateState = (newState: EditorTimelineState) => {
    setTimelineState(newState);
    setSaveStatus("unsaved");
    triggerAutosave(newState);
  };

  // Undo / Redo
  const handleUndo = () => {
    const undone = managerRef.current.undo();
    if (undone) updateState(undone);
  };

  const handleRedo = () => {
    const redone = managerRef.current.redo();
    if (redone) updateState(redone);
  };

  // Left Panel Actions
  const handleAddMediaToTimeline = (asset: any) => {
    const track = timelineState.tracks.find((t) => t.type === "VIDEO" || t.type === "IMAGE") || timelineState.tracks[0];
    if (!track) return;

    const newState = managerRef.current.addClipToTrack(track.id, {
      name: asset.name,
      sourceAssetId: asset.id,
      sourceUrl: asset.url,
      thumbnailUrl: asset.thumbnailUrl || asset.url,
      mimeType: asset.mimeType || "video/mp4",
      sourceIn: 0,
      sourceOut: 5,
      timelineStart: currentTime,
      timelineDuration: 5,
    });

    updateState(newState);
    showToast(`Added "${asset.name}" to timeline`, "success");
  };

  const handleAddTextToTimeline = (preset: any) => {
    const track = timelineState.tracks.find((t) => t.type === "TEXT") || timelineState.tracks[0];
    if (!track) return;

    const newState = managerRef.current.getState();
    const newTextLayer = {
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trackId: track.id,
      text: preset.title,
      fontFamily: preset.font,
      fontSize: preset.size,
      fontWeight: preset.weight,
      color: preset.color,
      positionX: 0,
      positionY: 0,
      width: 600,
      alignment: "center" as const,
      animation: "FADE" as const,
      timelineStart: currentTime,
      timelineDuration: 5,
    };

    track.textLayers.push(newTextLayer);
    updateState(newState);
    showToast(`Added text "${preset.title}"`, "success");
  };

  const handleGenerateCaptions = async () => {
    showToast("Generating auto-captions...", "info");
    try {
      await generateAutoCaptionsAction(initialProject.id);
      const res = await fetch(`/api/editor/${initialProject.id}`);
      showToast("Auto-captions generated successfully!", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to generate captions", "error");
    }
  };

  const handleSplitAtPlayhead = (clipId: string) => {
    const newState = managerRef.current.splitClipAtPlayhead(clipId, currentTime);
    updateState(newState);
    showToast("Clip split at playhead", "info");
  };

  const handleDeleteClip = (clipId: string) => {
    const newState = managerRef.current.deleteClip(clipId);
    setSelectedClipId(null);
    updateState(newState);
    showToast("Clip deleted", "info");
  };

  const handleExport = async () => {
    showToast("Starting background render export...", "info");
    try {
      const res = await renderAndExportEditorVideoAction(initialProject.id);
      showToast(`Export complete: ${res.asset.name}`, "success");
    } catch (err: any) {
      showToast(err?.message || "Export failed", "error");
    }
  };

  // Selected Clip object
  let selectedClip: TimelineClip | null = null;
  if (selectedClipId) {
    for (const t of timelineState.tracks || []) {
      const c = t.clips.find((clip) => clip.id === selectedClipId);
      if (c) {
        selectedClip = c;
        break;
      }
    }
  }

  return (
    <div className="h-screen w-full bg-[#09090b] text-foreground flex flex-col overflow-hidden font-sans">
      {/* Top Bar */}
      <EditorTopBar
        projectName={initialProject.name}
        aspectRatio={timelineState.aspectRatio}
        saveStatus={saveStatus}
        previewQuality={previewQuality}
        canUndo={true}
        canRedo={true}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAspectRatioChange={(aspect) => {
          const newState = { ...timelineState, aspectRatio: aspect };
          updateState(newState);
        }}
        onPreviewQualityChange={(q) => setPreviewQuality(q)}
        onExport={handleExport}
      />

      {/* Main 3-Column Middle Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <EditorLeftPanel
          userAssets={userAssets}
          onAddMediaToTimeline={handleAddMediaToTimeline}
          onAddTextToTimeline={handleAddTextToTimeline}
          onGenerateCaptions={handleGenerateCaptions}
          onAddTransition={() => showToast("Transition added to clip boundary", "info")}
          onAddEffect={() => showToast("Visual effect applied", "info")}
        />

        {/* Center Canvas Preview */}
        <EditorCanvasPreview
          timelineState={timelineState}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onPlayPauseToggle={() => setIsPlaying(!isPlaying)}
          onSeek={(t) => setCurrentTime(t)}
        />

        {/* Right Inspector Panel */}
        <EditorInspectorPanel
          selectedClip={selectedClip}
          currentTime={currentTime}
          onUpdateClipTransform={(clipId, transform) => {
            if (selectedClip) {
              selectedClip.transforms = transform;
              updateState({ ...timelineState });
            }
          }}
          onUpdateClipSpeed={(clipId, speed) => {
            if (selectedClip) {
              selectedClip.speed = speed;
              updateState({ ...timelineState });
            }
          }}
          onUpdateClipVolume={(clipId, volume) => {
            if (selectedClip) {
              selectedClip.volume = volume;
              updateState({ ...timelineState });
            }
          }}
          onAddKeyframe={(clipId, prop, val) => {
            const newState = managerRef.current.addKeyframe(clipId, prop, currentTime, val);
            updateState(newState);
            showToast(`Added ${prop} keyframe at ${currentTime.toFixed(2)}s`, "success");
          }}
          onDeleteClip={handleDeleteClip}
        />
      </div>

      {/* Bottom Timeline */}
      <EditorTimeline
        timelineState={timelineState}
        currentTime={currentTime}
        selectedClipId={selectedClipId}
        onSelectClip={(id) => setSelectedClipId(id)}
        onSeek={(t) => setCurrentTime(t)}
        onSplitAtPlayhead={handleSplitAtPlayhead}
        onDeleteClip={handleDeleteClip}
      />
    </div>
  );
}
