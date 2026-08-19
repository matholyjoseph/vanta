"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  Plus,
  Play,
  Wand2,
  Users,
  Layers,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Film,
  Download,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScriptBreakdownModal } from "@/components/projects/script-breakdown-modal";
import { NewElementModal } from "@/components/projects/new-element-modal";
import { useToast } from "@/components/ui/toast";
import { submitGenerationAction } from "@/app/actions/generation";
import {
  createSceneAction,
  deleteSceneAction,
  reorderScenesAction,
  createShotAction,
  updateShotAction,
  deleteShotAction,
  deleteProjectElementAction,
  exportFilmAction,
  renameProjectAction,
} from "@/app/actions/projects";

interface ShotItem {
  id: string;
  shotNumber: string;
  prompt: string;
  duration: string;
  status: string;
  generationId?: string | null;
  assetId?: string | null;
  videoUrl?: string | null;
  order: number;
}

interface SceneItem {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  shots: ShotItem[];
}

interface ElementItem {
  id: string;
  name: string;
  type: string; // CHARACTER | LOCATION | PROP | STYLE
  description?: string | null;
  prompt?: string | null;
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  sceneCount: number;
  scenes: SceneItem[];
  elements: ElementItem[];
}

interface CinemaStudioClientProps {
  initialProject: ProjectData;
}

export function CinemaStudioClient({ initialProject }: CinemaStudioClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [project, setProject] = React.useState<ProjectData>(initialProject);
  const [activeSceneId, setActiveSceneId] = React.useState<string>(
    initialProject.scenes.length > 0 ? initialProject.scenes[0].id : ""
  );
  const [activeShotId, setActiveShotId] = React.useState<string | null>(null);
  const [elementTab, setElementTab] = React.useState<"CHARACTER" | "LOCATION" | "PROP" | "STYLE">("CHARACTER");

  // Save Status State: 'saved' | 'saving' | 'error'
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving" | "error">("saved");

  // Modals state
  const [scriptModalOpen, setScriptModalOpen] = React.useState(false);
  const [elementModalOpen, setElementModalOpen] = React.useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = React.useState<"scenes" | "elements" | null>(null);

  // Rename Project State
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState(initialProject.name);

  // Preview Video Modal
  const [previewVideoUrl, setPreviewVideoUrl] = React.useState<string | null>(null);

  const activeScene = project.scenes.find((s) => s.id === activeSceneId) || project.scenes[0];

  // Helper trigger for save indicator
  const triggerSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
    }, 800);
  };

  // Title Rename Handler
  const handleTitleSubmit = async () => {
    if (!titleInput.trim()) return;
    setIsEditingTitle(false);
    triggerSave();
    try {
      await renameProjectAction(project.id, titleInput);
      setProject((prev) => ({ ...prev, name: titleInput }));
      showToast("Project title updated", "success");
    } catch {
      showToast("Failed to rename project", "error");
    }
  };

  // Add Scene Handler
  const handleAddScene = async () => {
    triggerSave();
    try {
      const newScene = await createSceneAction(project.id, `Scene ${(project.scenes.length + 1).toString().padStart(2, "0")}`);
      setProject((prev) => ({
        ...prev,
        scenes: [...prev.scenes, { ...newScene, shots: newScene.shots || [] }],
        sceneCount: prev.scenes.length + 1,
      }));
      setActiveSceneId(newScene.id);
      showToast(`Created ${newScene.title}`, "success");
    } catch {
      showToast("Failed to add scene", "error");
    }
  };

  // Move Scene Handler (Reorder)
  const handleMoveScene = async (index: number, direction: "up" | "down") => {
    const newScenes = [...project.scenes];
    const targetIdx = direction === "up" ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= newScenes.length) return;

    const temp = newScenes[index];
    newScenes[index] = newScenes[targetIdx];
    newScenes[targetIdx] = temp;

    setProject((prev) => ({ ...prev, scenes: newScenes }));
    triggerSave();

    try {
      await reorderScenesAction(
        project.id,
        newScenes.map((s) => s.id)
      );
    } catch {
      showToast("Failed to reorder scenes", "error");
    }
  };

  // Delete Scene Handler
  const handleDeleteScene = async (sceneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.scenes.length <= 1) {
      showToast("Cannot delete the only scene in a project", "error");
      return;
    }
    triggerSave();
    try {
      await deleteSceneAction(sceneId);
      const updatedScenes = project.scenes.filter((s) => s.id !== sceneId);
      setProject((prev) => ({ ...prev, scenes: updatedScenes }));
      if (activeSceneId === sceneId) {
        setActiveSceneId(updatedScenes[0].id);
      }
      showToast("Scene deleted", "info");
    } catch {
      showToast("Failed to delete scene", "error");
    }
  };

  // Add Shot Handler
  const handleAddShot = async () => {
    if (!activeScene) return;
    triggerSave();
    try {
      const newShot = await createShotAction(activeScene.id, "New shot description prompt");
      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((sc) =>
          sc.id === activeScene.id
            ? { ...sc, shots: [...sc.shots, newShot] }
            : sc
        ),
      }));
      showToast(`Added ${newShot.shotNumber}`, "success");
    } catch {
      showToast("Failed to add shot", "error");
    }
  };

  // Update Shot Prompt
  const handleUpdateShotPrompt = async (shotId: string, promptText: string) => {
    triggerSave();
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((sc) => ({
        ...sc,
        shots: sc.shots.map((sh) => (sh.id === shotId ? { ...sh, prompt: promptText } : sh)),
      })),
    }));

    try {
      await updateShotAction(shotId, { prompt: promptText });
    } catch {
      setSaveStatus("error");
    }
  };

  // Generate Shot (Connects to existing Video Generation Architecture!)
  const handleGenerateShot = async (shot: ShotItem) => {
    triggerSave();
    // Update local state to QUEUED / GENERATING
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((sc) => ({
        ...sc,
        shots: sc.shots.map((sh) => (sh.id === shot.id ? { ...sh, status: "GENERATING" } : sh)),
      })),
    }));

    try {
      const res = await submitGenerationAction({
        modelId: "vanta-v2-cinema",
        mode: "text-to-video",
        prompt: shot.prompt,
        resolution: "1920x1080",
        duration: shot.duration,
        aspectRatio: "16:9",
        fps: 24,
      });

      showToast(`Generating ${shot.shotNumber}...`, "info");

      // Poll status until completion
      const interval = setInterval(async () => {
        const statusRes = await fetch(`/api/generation/${res.generation.id}/status`);
        if (statusRes.ok) {
          const data = await statusRes.json();
          if (data.generation?.status === "COMPLETED") {
            clearInterval(interval);
            const videoUrl = data.generation.videoUrl || "/placeholder-video.mp4";

            await updateShotAction(shot.id, {
              status: "COMPLETED",
              videoUrl,
            });

            setProject((prev) => ({
              ...prev,
              scenes: prev.scenes.map((sc) => ({
                ...sc,
                shots: sc.shots.map((sh) =>
                  sh.id === shot.id
                    ? { ...sh, status: "COMPLETED", videoUrl }
                    : sh
                ),
              })),
            }));

            showToast(`${shot.shotNumber} generated successfully!`, "success");
          }
        }
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      showToast(msg, "error");
      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((sc) => ({
          ...sc,
          shots: sc.shots.map((sh) => (sh.id === shot.id ? { ...sh, status: "IDLE" } : sh)),
        })),
      }));
    }
  };

  // Delete Shot Handler
  const handleDeleteShot = async (shotId: string) => {
    triggerSave();
    try {
      await deleteShotAction(shotId);
      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((sc) => ({
          ...sc,
          shots: sc.shots.filter((sh) => sh.id !== shotId),
        })),
      }));
      showToast("Shot deleted", "info");
    } catch {
      showToast("Failed to delete shot", "error");
    }
  };

  // Insert Element Tag Into Active Shot Prompt
  const handleInsertElementTag = (tagName: string) => {
    if (!activeShotId) {
      showToast("Select a shot card to insert element tag", "info");
      return;
    }

    const targetShot = activeScene.shots.find((sh) => sh.id === activeShotId);
    if (!targetShot) return;

    const newPrompt = `${targetShot.prompt} @${tagName}`;
    handleUpdateShotPrompt(activeShotId, newPrompt);
    showToast(`Inserted @${tagName} into ${targetShot.shotNumber}`, "success");
  };

  // Delete Element Handler
  const handleDeleteElement = async (elementId: string) => {
    try {
      await deleteProjectElementAction(elementId);
      setProject((prev) => ({
        ...prev,
        elements: prev.elements.filter((e) => e.id !== elementId),
      }));
      showToast("Element removed", "info");
    } catch {
      showToast("Failed to delete element", "error");
    }
  };

  // Export Film Handler
  const handleExportFilm = async () => {
    try {
      showToast("Initiating film export compilation...", "info");
      const exportResult = await exportFilmAction(project.id);
      showToast(`Film exported successfully! (${exportResult.durationSeconds}s)`, "success");
      setPreviewVideoUrl(exportResult.url);
    } catch {
      showToast("Export failed", "error");
    }
  };

  // Highlight @Name tags in prompt preview
  const renderPromptWithTags = (promptText: string) => {
    const parts = promptText.split(/(@\w+)/g);
    return parts.map((part, idx) =>
      part.startsWith("@") ? (
        <span key={idx} className="text-accent font-bold font-mono">
          {part}
        </span>
      ) : (
        <span key={idx}>{part}</span>
      )
    );
  };

  // Filtered elements for active right sidebar tab
  const filteredElements = project.elements.filter((e) => e.type === elementTab);

  // All completed shots for bottom timeline track
  const completedShots = React.useMemo(() => {
    const shots: ShotItem[] = [];
    for (const sc of project.scenes) {
      for (const sh of sc.shots) {
        if (sh.status === "COMPLETED" || sh.videoUrl) {
          shots.push(sh);
        }
      }
    }
    return shots;
  }, [project]);

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
      {/* Subheader Bar (Screenshot 6 Layout) */}
      <div className="border-b border-border bg-surface/90 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-muted hover:text-foreground">
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
                  autoFocus
                  className="bg-background border border-accent rounded px-2 py-0.5 text-lg font-bold text-foreground focus:outline-none"
                />
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="text-xl font-bold text-foreground cursor-pointer hover:text-accent flex items-center gap-2"
                >
                  {project.name}
                  <Edit3 className="h-4 w-4 text-muted" />
                </h1>
              )}
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] text-muted uppercase">
              <span>{project.description || "SCI-FI SHORT • 24FPS • 4K UHD"}</span>
              <span>•</span>
              {/* Autosave Status Indicator */}
              <span className="flex items-center gap-1 text-accent">
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Saved
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Scene & Element Drawer Triggers */}
          <div className="flex lg:hidden items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveMobilePanel("scenes")}
              className="text-xs font-mono border-border"
            >
              Scenes ({project.scenes.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveMobilePanel("elements")}
              className="text-xs font-mono border-border"
            >
              Elements ({project.elements.length})
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setScriptModalOpen(true)}
            className="text-xs font-mono border-border hover:bg-surface hidden sm:inline-flex"
          >
            <Wand2 className="mr-1.5 h-3.5 w-3.5 text-accent" /> Script-to-Scenes
          </Button>

          <Button
            size="sm"
            onClick={handleExportFilm}
            className="bg-accent text-accent-foreground font-bold text-xs shadow-md"
          >
            <Play className="mr-1.5 h-3.5 w-3.5 fill-current" /> Export Film
          </Button>
        </div>
      </div>

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden min-h-0">
        {/* Left Sidebar: Scene List */}
        <div className="col-span-3 border-r border-border p-4 space-y-4 bg-[#09090b] overflow-y-auto flex flex-col justify-between hidden lg:flex">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted">
              <span>SCENES ({project.scenes.length})</span>
              <button
                onClick={handleAddScene}
                className="p-1 rounded bg-surface hover:bg-surface-hover border border-border text-foreground hover:text-accent transition-colors"
                title="Add Scene"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {project.scenes.map((scene, idx) => {
                const isActive = scene.id === activeScene.id;
                return (
                  <div
                    key={scene.id}
                    onClick={() => setActiveSceneId(scene.id)}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                      isActive
                        ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(200,255,0,0.1)]"
                        : "border-border bg-surface hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className={isActive ? "text-accent" : "text-foreground"}>
                        {scene.title}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveScene(idx, "up");
                          }}
                          disabled={idx === 0}
                          className="p-0.5 text-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveScene(idx, "down");
                          }}
                          disabled={idx === project.scenes.length - 1}
                          className="p-0.5 text-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteScene(scene.id, e)}
                          className="p-0.5 text-muted hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-muted">
                      ❖ {scene.shots.length} {scene.shots.length === 1 ? "Shot" : "Shots"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Storyboard Shots Grid */}
        <div className="col-span-12 lg:col-span-6 p-6 space-y-6 overflow-y-auto bg-background">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span className="font-bold text-foreground uppercase tracking-wider">
              {activeScene ? activeScene.title : "STORYBOARD"}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleAddShot} className="text-xs">
                + Add Shot
              </Button>
            </div>
          </div>

          {activeScene && activeScene.shots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
              <p className="text-xs text-muted">No shots in this scene.</p>
              <Button size="sm" onClick={handleAddShot} className="bg-accent text-accent-foreground">
                + Create First Shot
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeScene?.shots.map((shot) => {
                const isSelected = activeShotId === shot.id;
                const isGenerating = shot.status === "GENERATING" || shot.status === "QUEUED";

                return (
                  <div
                    key={shot.id}
                    onClick={() => setActiveShotId(shot.id)}
                    className={`group rounded-xl border p-3.5 space-y-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-accent bg-accent/5 shadow-[0_0_20px_rgba(200,255,0,0.1)]"
                        : "border-border bg-surface hover:border-accent/40"
                    }`}
                  >
                    {/* Media Thumbnail Container */}
                    <div className="aspect-video rounded-lg bg-background border border-border relative overflow-hidden flex flex-col items-center justify-center p-2 text-center">
                      <span className="absolute top-2 left-2 text-[10px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-foreground font-bold z-10">
                        {shot.shotNumber}
                      </span>
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-foreground z-10">
                        {shot.duration}
                      </span>

                      {isGenerating ? (
                        <div className="space-y-1.5 text-center">
                          <Loader2 className="h-6 w-6 text-accent animate-spin mx-auto" />
                          <div className="font-mono text-[10px] font-bold text-accent">
                            RENDERING FRAMES
                          </div>
                        </div>
                      ) : shot.videoUrl ? (
                        <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
                          <Play className="h-8 w-8 text-accent opacity-80" />
                        </div>
                      ) : (
                        <Film className="h-6 w-6 text-muted group-hover:text-accent transition-colors" />
                      )}
                    </div>

                    {/* Editable Prompt */}
                    <div className="space-y-1">
                      <textarea
                        value={shot.prompt}
                        onChange={(e) => handleUpdateShotPrompt(shot.id, e.target.value)}
                        rows={2}
                        className="w-full bg-background border border-border/60 rounded-md p-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none leading-relaxed font-sans"
                      />
                      <div className="text-[10px] font-mono text-muted line-clamp-1">
                        Parsed: {renderPromptWithTags(shot.prompt)}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <Button
                        size="sm"
                        disabled={isGenerating}
                        onClick={() => handleGenerateShot(shot)}
                        className="h-7 text-xs bg-accent text-accent-foreground font-bold px-3"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : shot.videoUrl ? (
                          "Regenerate"
                        ) : (
                          "Generate Shot"
                        )}
                      </Button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteShot(shot.id);
                          }}
                          className="p-1 text-muted hover:text-destructive"
                          title="Delete shot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Project Elements */}
        <div className="col-span-3 border-l border-border p-4 space-y-5 bg-[#09090b] overflow-y-auto flex flex-col justify-between hidden xl:flex">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-accent" /> ELEMENTS ({project.elements.length})
              </span>
              <button
                onClick={() => setElementModalOpen(true)}
                className="p-1 rounded bg-surface hover:bg-surface-hover border border-border text-foreground hover:text-accent transition-colors"
                title="Add Element"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Element Category Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-surface p-1 rounded-xl border border-border text-[10px] font-mono">
              {[
                { id: "CHARACTER", label: "Characters" },
                { id: "LOCATION", label: "Locations" },
                { id: "PROP", label: "Props" },
                { id: "STYLE", label: "Styles" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setElementTab(tab.id as "CHARACTER" | "LOCATION" | "PROP" | "STYLE")}
                  className={`py-1.5 px-2 rounded-lg text-center font-semibold transition-all ${
                    elementTab === tab.id
                      ? "bg-surface-hover text-accent border border-accent/30"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Elements List */}
            {filteredElements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2">
                <p className="text-xs text-muted">No {elementTab.toLowerCase()} elements created.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setElementModalOpen(true)}
                  className="text-xs"
                >
                  + Add {elementTab}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredElements.map((el) => (
                  <div
                    key={el.id}
                    className="group p-3 rounded-xl border border-border bg-surface space-y-2 hover:border-accent/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-accent">
                        @{el.name}
                      </span>
                      <button
                        onClick={() => handleDeleteElement(el.id)}
                        className="p-1 text-muted hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete element"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {el.description && (
                      <p className="text-xs text-muted line-clamp-2">{el.description}</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInsertElementTag(el.name)}
                      className="w-full h-7 text-[11px] font-mono border-border hover:bg-surface-hover text-foreground"
                    >
                      + Insert @{el.name} into Prompt
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sequential Film Timeline Track */}
      <div className="border-t border-border bg-[#09090b] p-3 shrink-0 flex items-center gap-4 overflow-x-auto">
        <div className="text-xs font-mono uppercase tracking-wider text-muted shrink-0 px-2 flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-accent" /> TIMELINE ({completedShots.length})
        </div>

        <div className="flex items-center gap-3 overflow-x-auto flex-1">
          {completedShots.length === 0 ? (
            <div className="text-xs text-muted font-mono italic px-2">
              Generated shots will appear sequentially here in the master timeline track.
            </div>
          ) : (
            completedShots.map((sh, idx) => (
              <div
                key={sh.id}
                onClick={() => sh.videoUrl && setPreviewVideoUrl(sh.videoUrl)}
                className="group relative w-32 aspect-video shrink-0 rounded-lg bg-background border border-accent/40 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform overflow-hidden shadow-md"
              >
                <div className="absolute top-1 left-1 text-[9px] font-mono bg-black/80 px-1 rounded text-foreground z-10">
                  {idx + 1}. {sh.shotNumber}
                </div>
                <Play className="h-5 w-5 text-accent opacity-80 group-hover:scale-110 transition-transform" />
              </div>
            ))
          )}
        </div>

        <Button
          size="sm"
          onClick={handleExportFilm}
          className="bg-accent text-accent-foreground font-bold text-xs shrink-0 ml-auto"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export Film
        </Button>
      </div>

      {/* Video Preview Dialog */}
      {previewVideoUrl && (
        <Dialog open={!!previewVideoUrl} onOpenChange={() => setPreviewVideoUrl(null)}>
          <DialogContent className="max-w-3xl bg-surface border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Film Timeline Output</DialogTitle>
            </DialogHeader>
            <div className="aspect-video w-full rounded-xl bg-background border border-border flex items-center justify-center relative overflow-hidden">
              <Play className="h-16 w-16 text-accent/50" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modals */}
      <ScriptBreakdownModal
        projectId={project.id}
        open={scriptModalOpen}
        onOpenChange={setScriptModalOpen}
        onSuccess={() => router.refresh()}
      />
      <NewElementModal
        projectId={project.id}
        open={elementModalOpen}
        onOpenChange={setElementModalOpen}
        defaultType={elementTab}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
