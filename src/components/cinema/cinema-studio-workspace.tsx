"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clapperboard,
  Film,
  Sparkles,
  Plus,
  Play,
  Pause,
  Download,
  FileText,
  Sliders,
  Check,
  User,
  MapPin,
  Package,
  Layers,
  Video,
  Music,
  Mic,
  Volume2,
  Share2,
  Trash2,
  RotateCcw,
  Loader2,
  ChevronRight,
  Maximize2,
  Scissors,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createSceneAction,
  createShotAction,
  generateStoryboardForShotAction,
  generateVideoForShotAction,
  selectShotTakeAction,
  importScriptAndBreakdownAction,
  exportFilmAction,
} from "@/app/actions/cinema-actions";

interface CinemaStudioWorkspaceProps {
  project: any;
}

export function CinemaStudioWorkspace({ project: initialProject }: CinemaStudioWorkspaceProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [project, setProject] = React.useState<any>(initialProject);
  const [activeSceneId, setActiveSceneId] = React.useState<string>(
    initialProject.scenes?.[0]?.id || ""
  );
  const [selectedShot, setSelectedShot] = React.useState<any | null>(
    initialProject.scenes?.[0]?.shots?.[0] || null
  );

  // Modals & Sliders
  const [scriptModalOpen, setScriptModalOpen] = React.useState(false);
  const [scriptText, setScriptText] = React.useState(initialProject.scriptText || "");
  const [isExporting, setIsExporting] = React.useState(false);
  const [isPlayingSequence, setIsPlayingSequence] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const activeScene = project.scenes?.find((s: any) => s.id === activeSceneId) || project.scenes?.[0];

  // Actions
  const handleAddScene = async () => {
    try {
      const newScene = await createSceneAction(project.id, `Scene ${project.scenes.length + 1}`);
      showToast("New scene created!", "success");
      router.refresh();
    } catch {
      showToast("Failed to create scene", "error");
    }
  };

  const handleAddShot = async () => {
    if (!activeScene) return;
    try {
      await createShotAction(activeScene.id, "Medium shot of scene action");
      showToast("New shot added to scene!", "success");
      router.refresh();
    } catch {
      showToast("Failed to add shot", "error");
    }
  };

  const handleGenerateStoryboard = async (shotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showToast("Generating Storyboard Frame...", "info");
    try {
      await generateStoryboardForShotAction(shotId);
      showToast("Storyboard frame generated!", "success");
      router.refresh();
    } catch {
      showToast("Failed to generate storyboard frame", "error");
    }
  };

  const handleGenerateVideo = async (shotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showToast("Rendering Video Take via Vanta Engine...", "info");
    try {
      await generateVideoForShotAction(shotId);
      showToast("Video Take generated!", "success");
      router.refresh();
    } catch {
      showToast("Failed to generate video take", "error");
    }
  };

  const handleSelectTake = async (shotId: string, takeId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    try {
      await selectShotTakeAction(shotId, takeId);
      showToast("Active shot take updated!", "info");
      router.refresh();
    } catch {
      showToast("Failed to select take", "error");
    }
  };

  const handleScriptBreakdown = async () => {
    if (!scriptText.trim()) return;
    setIsSubmitting(true);
    try {
      await importScriptAndBreakdownAction(project.id, scriptText.trim());
      showToast("Script Breakdown complete! Created Scenes & Shots.", "success");
      setScriptModalOpen(false);
      router.refresh();
    } catch {
      showToast("Failed to parse script breakdown", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportFilm = async () => {
    setIsExporting(true);
    showToast("Starting background FFmpeg film export...", "info");
    try {
      const res = await exportFilmAction(project.id);
      showToast(`Film Export Complete! Created '${res.export.name}'`, "success");
      router.refresh();
    } catch {
      showToast("Film Export failed", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground font-sans overflow-hidden">
      {/* ─── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-border bg-[#09090b] px-4 flex items-center justify-between shrink-0 font-mono text-xs">
        <div className="flex items-center gap-4">
          <Link href="/cinema" className="flex items-center gap-2 font-bold text-foreground hover:text-accent">
            <Clapperboard className="h-5 w-5 text-accent" />
            <span className="text-sm font-sans tracking-tight">{project.name}</span>
          </Link>
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            ● Saved
          </Badge>
          <Badge variant="outline" className="text-[10px] text-muted border-border">
            {project.aspectRatio || "16:9"}
          </Badge>
        </div>

        {/* Budget & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-muted text-[11px]">
            <span>SPENT: <strong className="text-accent">{project.creditSpent || 0} CR</strong></span>
            <span>/</span>
            <span>BUDGET: {project.creditBudget || 2000} CR</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setScriptModalOpen(true)}
            className="h-8 text-xs font-mono border-border"
          >
            <FileText className="h-3.5 w-3.5 mr-1" /> Script Breakdown
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPlayingSequence(!isPlayingSequence)}
            className="h-8 text-xs font-mono border-border"
          >
            {isPlayingSequence ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
            Preview Film
          </Button>

          <Button
            size="sm"
            onClick={handleExportFilm}
            disabled={isExporting}
            className="h-8 bg-accent text-accent-foreground font-bold text-xs"
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Film className="h-3.5 w-3.5 mr-1" />}
            Export Film
          </Button>
        </div>
      </header>

      {/* ─── MAIN 3-COLUMN STUDIO LAYOUT ───────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden min-h-0">
        {/* COLUMN 1: LEFT SCENES SIDEBAR */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2 border-r border-border bg-[#09090b] p-3 space-y-4 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-foreground">
              <span>SCENES ({project.scenes?.length || 0})</span>
              <button
                onClick={handleAddScene}
                className="p-1 rounded bg-surface hover:bg-surface-hover border border-border text-accent"
                title="Add Scene"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1 font-mono text-xs">
              {project.scenes?.map((scene: any) => {
                const isActive = scene.id === activeSceneId;
                return (
                  <button
                    key={scene.id}
                    onClick={() => {
                      setActiveSceneId(scene.id);
                      setSelectedShot(scene.shots?.[0] || null);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? "bg-accent/15 text-accent border-accent/40 font-bold"
                        : "bg-surface border-border text-muted hover:text-foreground"
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate text-[11px]">{scene.title}</div>
                      <div className="text-[9px] text-muted">{scene.shots?.length || 0} Shots</div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* COLUMN 2: CENTER STORYBOARD / SHOTS WORKSPACE */}
        <main className="col-span-12 md:col-span-6 lg:col-span-7 p-4 space-y-4 overflow-y-auto bg-background flex flex-col justify-between">
          <div className="space-y-4">
            {/* Scene Header */}
            {activeScene && (
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{activeScene.title}</h2>
                  <p className="text-xs text-muted font-mono">{activeScene.description || "Scene storyboard workspace"}</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleAddShot} className="h-8 text-xs font-mono border-border">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Shot
                </Button>
              </div>
            )}

            {/* Shots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeScene?.shots?.map((shot: any) => {
                const isSelected = selectedShot?.id === shot.id;
                const mediaUrl = shot.videoUrl || shot.storyboardUrl || "/werewolf_cinematic_preview.jpg";

                return (
                  <div
                    key={shot.id}
                    onClick={() => setSelectedShot(shot)}
                    className={`group relative rounded-2xl border p-3 space-y-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-border bg-surface hover:border-accent/40"
                    }`}
                  >
                    {/* Media Thumbnail */}
                    <div className="relative aspect-video w-full rounded-xl bg-background border border-border overflow-hidden flex items-center justify-center">
                      <img src={mediaUrl} alt={shot.prompt} className="w-full h-full object-cover" />
                      <Badge variant="outline" className="absolute top-2 left-2 text-[9px] font-mono bg-black/80 text-accent border-accent/30">
                        SHOT {shot.shotNumber}
                      </Badge>
                      <Badge variant="outline" className="absolute top-2 right-2 text-[9px] font-mono bg-black/80 text-foreground border-border">
                        {shot.shotSize || "Medium"}
                      </Badge>
                    </div>

                    {/* Shot Prompt & Camera Specs */}
                    <div className="space-y-1 font-mono text-xs">
                      <p className="text-foreground line-clamp-2 italic font-sans text-[11px]">
                        &ldquo;{shot.prompt}&rdquo;
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        <span>{shot.cameraAngle || "Eye Level"}</span>
                        <span>•</span>
                        <span>{shot.cameraMovement || "Static"}</span>
                        <span>•</span>
                        <span>{shot.lens || "35mm"}</span>
                      </div>
                    </div>

                    {/* Takes Selector Dropdown & Generation Actions */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 font-mono text-[10px]">
                      {shot.takes?.length > 0 ? (
                        <select
                          value={shot.selectedTakeId || ""}
                          onChange={(e) => handleSelectTake(shot.id, e.target.value, e)}
                          className="bg-background border border-border rounded-lg p-1 text-accent font-bold"
                        >
                          {shot.takes.map((t: any) => (
                            <option key={t.id} value={t.id}>
                              Take {t.takeNumber} ({t.creditCost} CR)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-muted">No Takes</span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleGenerateStoryboard(shot.id, e)}
                          className="p-1 rounded hover:bg-surface-hover text-muted hover:text-accent"
                          title="Generate Storyboard"
                        >
                          <Layers className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleGenerateVideo(shot.id, e)}
                          className="p-1 rounded hover:bg-surface-hover text-accent font-bold"
                          title="Generate Video Take"
                        >
                          <Video className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── BOTTOM MULTITRACK FILM TIMELINE ──────────────────────────── */}
          <div className="rounded-2xl border border-border bg-[#09090b] p-3 space-y-2 shrink-0 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Film className="h-4 w-4 text-accent" /> Multitrack Film Timeline
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsPlayingSequence(!isPlayingSequence)} className="h-7 text-[10px] font-mono">
                  {isPlayingSequence ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                  {isPlayingSequence ? "Pause" : "Play Sequence"}
                </Button>
              </div>
            </div>

            {/* Multitrack Timeline Bars */}
            <div className="space-y-1.5 text-[10px]">
              {/* Track 1: Video */}
              <div className="flex items-center gap-3">
                <span className="w-16 font-bold text-accent shrink-0">VIDEO</span>
                <div className="flex-1 h-6 bg-surface rounded-lg border border-border p-1 flex items-center gap-1 overflow-x-auto">
                  {activeScene?.shots?.map((s: any) => (
                    <div key={s.id} className="h-full bg-accent/20 border border-accent/40 rounded px-2 text-accent text-[9px] flex items-center font-bold whitespace-nowrap">
                      Shot {s.shotNumber}
                    </div>
                  ))}
                </div>
              </div>

              {/* Track 2: Dialogue / Voiceover */}
              <div className="flex items-center gap-3">
                <span className="w-16 font-bold text-emerald-400 shrink-0">DIALOGUE</span>
                <div className="flex-1 h-6 bg-surface rounded-lg border border-border p-1 flex items-center gap-1 overflow-x-auto">
                  <div className="h-full bg-emerald-500/20 border border-emerald-500/40 rounded px-2 text-emerald-400 text-[9px] flex items-center font-bold">
                    Voiceover Track 1
                  </div>
                </div>
              </div>

              {/* Track 3: Music */}
              <div className="flex items-center gap-3">
                <span className="w-16 font-bold text-cyan-400 shrink-0">MUSIC</span>
                <div className="flex-1 h-6 bg-surface rounded-lg border border-border p-1 flex items-center gap-1 overflow-x-auto">
                  <div className="h-full bg-cyan-500/20 border border-cyan-500/40 rounded px-2 text-cyan-400 text-[9px] flex items-center font-bold">
                    Cinematic Orchestra Score
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* COLUMN 3: RIGHT REUSABLE ELEMENTS & SHOT INSPECTOR */}
        <aside className="col-span-12 lg:col-span-3 border-l border-border bg-[#09090b] p-4 space-y-6 overflow-y-auto">
          {/* Reusable Project Elements */}
          <div className="space-y-3 border-b border-border pb-4">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-foreground">
              <span>PROJECT ELEMENTS ({project.elements?.length || 0})</span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {project.elements?.map((elem: any) => (
                <div key={elem.id} className="p-2 rounded-xl bg-surface border border-border flex items-center justify-between text-muted">
                  <div className="flex items-center gap-2 font-bold text-foreground truncate">
                    {elem.type === "CHARACTER" ? <User className="h-3.5 w-3.5 text-accent" /> : <MapPin className="h-3.5 w-3.5 text-accent" />}
                    <span className="truncate">{elem.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] text-accent border-accent/30">
                    {elem.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Shot Inspector */}
          {selectedShot && (
            <div className="space-y-4 font-mono text-xs">
              <div className="font-bold text-sm text-foreground flex items-center gap-2">
                <Sliders className="h-4 w-4 text-accent" /> Shot Inspector ({selectedShot.shotNumber})
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-muted uppercase block">Shot Size</label>
                <select
                  value={selectedShot.shotSize || "Medium Shot"}
                  onChange={() => {}}
                  className="w-full bg-surface border border-border rounded-xl p-2 text-foreground text-xs"
                >
                  <option value="Wide">Wide Establishing</option>
                  <option value="Medium Shot">Medium Shot</option>
                  <option value="Close-Up">Close-Up</option>
                  <option value="Extreme Close-Up">Extreme Close-Up</option>
                </select>

                <label className="text-[10px] text-muted uppercase block pt-2">Camera Angle</label>
                <select
                  value={selectedShot.cameraAngle || "Eye Level"}
                  onChange={() => {}}
                  className="w-full bg-surface border border-border rounded-xl p-2 text-foreground text-xs"
                >
                  <option value="Eye Level">Eye Level</option>
                  <option value="Low Angle">Low Angle</option>
                  <option value="High Angle">High Angle</option>
                  <option value="Dutch Angle">Dutch Angle</option>
                </select>

                <label className="text-[10px] text-muted uppercase block pt-2">Camera Movement</label>
                <select
                  value={selectedShot.cameraMovement || "Static"}
                  onChange={() => {}}
                  className="w-full bg-surface border border-border rounded-xl p-2 text-foreground text-xs"
                >
                  <option value="Static">Static</option>
                  <option value="Pan Left">Pan Left</option>
                  <option value="Zoom In">Zoom In</option>
                  <option value="Dolly">Dolly In</option>
                  <option value="Orbit">Orbit</option>
                </select>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Script Breakdown Modal */}
      {scriptModalOpen && (
        <Dialog open={scriptModalOpen} onOpenChange={setScriptModalOpen}>
          <DialogContent className="max-w-xl bg-surface border-border text-foreground font-sans">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-lg font-bold">
                Script Importer & AI Breakdown
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2 font-mono text-xs">
              <p className="text-muted text-xs leading-relaxed font-sans">
                Paste your film screenplay or script text below. VANTA ScriptBreakdownService will automatically parse scenes, shots, and dialogue lines.
              </p>

              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="EXT. NEON CITY STREET - NIGHT&#10;A slick sports car speeds through the rainy alleyway..."
                rows={8}
                className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none leading-relaxed"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setScriptModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleScriptBreakdown} disabled={isSubmitting || !scriptText.trim()} className="bg-accent text-accent-foreground font-bold">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Break Down Script"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
