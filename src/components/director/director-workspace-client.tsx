"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Clapperboard,
  Film,
  Send,
  ShieldCheck,
  Layers,
  ChevronRight,
  Video,
  Music,
  Mic,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  approveDirectorPlanAction,
  pauseDirectorRunAction,
  resumeDirectorRunAction,
  cancelDirectorRunAction,
  sendDirectorInstructionAction,
  updateDirectorPlanAction,
} from "@/app/actions/director-actions";
import { ToastProvider, useToast } from "@/components/ui/toast";

export function DirectorWorkspaceClient({ initialRun }: { initialRun: any }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [run, setRun] = React.useState(initialRun);
  const [activeTab, setActiveTab] = React.useState<"plan" | "tasks" | "feed">("plan");
  const [chatInput, setChatInput] = React.useState("");
  const [isSendingChat, setIsSendingChat] = React.useState(false);
  const [isApproving, setIsApproving] = React.useState(false);
  const [isEditingPlan, setIsEditingPlan] = React.useState(false);

  // Editable Plan state
  const [editableScript, setEditableScript] = React.useState(initialRun.planJson?.scriptText || "");
  const plan = run.planJson || {};

  // Auto-refresh events and status every 3 seconds if executing or planning
  React.useEffect(() => {
    if (run.status !== "EXECUTING" && run.status !== "PLANNING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/director/run/${run.id}/events`);
        if (res.ok) {
          const data = await res.json();
          setRun((prev: any) => ({
            ...prev,
            status: data.status,
            currentStage: data.currentStage,
            progress: data.progress,
            events: data.events || prev.events,
          }));
        }
      } catch {
        // quiet fallback
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [run.id, run.status]);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const updated = await approveDirectorPlanAction(run.id);
      setRun((prev: any) => ({ ...prev, status: "EXECUTING", currentStage: "CREATING_REFERENCES" }));
      showToast("Starting automated production execution...", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to approve plan", "error");
    } finally {
      setIsApproving(false);
    }
  };

  const handlePause = async () => {
    try {
      await pauseDirectorRunAction(run.id);
      setRun((prev: any) => ({ ...prev, status: "PAUSED" }));
      showToast("Task graph execution suspended.", "info");
    } catch (err: any) {
      showToast(err?.message, "error");
    }
  };

  const handleResume = async () => {
    try {
      await resumeDirectorRunAction(run.id);
      setRun((prev: any) => ({ ...prev, status: "EXECUTING" }));
      showToast("Resuming automated task execution...", "success");
    } catch (err: any) {
      showToast(err?.message, "error");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelDirectorRunAction(run.id);
      setRun((prev: any) => ({ ...prev, status: "CANCELLED" }));
      showToast("Director run has been cancelled.", "info");
    } catch (err: any) {
      showToast(err?.message, "error");
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setIsSendingChat(true);
    const instructionText = chatInput.trim();
    setChatInput("");

    try {
      await sendDirectorInstructionAction(run.id, instructionText);
      showToast(`Updating production state for: "${instructionText}"`, "success");
    } catch (err: any) {
      showToast(err?.message, "error");
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleSavePlanEdits = async () => {
    try {
      const updatedPlan = {
        ...plan,
        scriptText: editableScript,
      };
      await updateDirectorPlanAction(run.id, updatedPlan);
      setRun((prev: any) => ({ ...prev, planJson: updatedPlan }));
      setIsEditingPlan(false);
      showToast("Updated script saved to production plan.", "success");
    } catch (err: any) {
      showToast(err?.message, "error");
    }
  };

  const isAwaitingApproval = run.status === "AWAITING_APPROVAL" || run.status === "NEEDS_APPROVAL";
  const project = run.project;
  const samplePreviewUrl = project?.exports?.[0]?.videoUrl || "/werewolf_cinematic_preview.jpg";

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden font-sans">
      {/* Top Stage & Header Bar */}
      <header className="h-16 border-b border-border bg-surface/90 px-6 flex items-center justify-between gap-4 shrink-0 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/director" className="text-muted hover:text-foreground transition-colors font-mono text-xs flex items-center gap-1">
            ← History
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" /> {plan.title || run.originalPrompt.substring(0, 30)}
            </h1>
            <p className="text-[11px] font-mono text-muted">Stage: {run.currentStage}</p>
          </div>
        </div>

        {/* Progress & Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 w-48 font-mono text-xs text-muted">
            <span>{run.progress}%</span>
            <div className="flex-1 bg-background rounded-full h-1.5 overflow-hidden">
              <div className="bg-accent h-full transition-all duration-500" style={{ width: `${run.progress}%` }} />
            </div>
          </div>

          <Badge
            variant="outline"
            className={`font-mono text-xs px-2.5 py-1 ${
              run.status === "COMPLETED"
                ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                : run.status === "EXECUTING"
                ? "border-accent text-accent bg-accent/10 animate-pulse"
                : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
            }`}
          >
            {run.status}
          </Badge>

          {/* Action Buttons */}
          {run.status === "EXECUTING" && (
            <Button size="sm" variant="outline" onClick={handlePause} className="text-xs font-mono border-border">
              <Pause className="h-3.5 w-3.5 mr-1" /> Pause
            </Button>
          )}

          {run.status === "PAUSED" && (
            <Button size="sm" onClick={handleResume} className="bg-accent text-accent-foreground text-xs font-mono font-bold">
              <Play className="h-3.5 w-3.5 mr-1" /> Resume
            </Button>
          )}

          {run.projectId && (
            <Button asChild size="sm" className="bg-accent text-accent-foreground font-bold text-xs">
              <Link href={`/cinema/${run.projectId}`}>
                <Clapperboard className="h-3.5 w-3.5 mr-1.5" /> Open in Cinema Studio
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Main 3-Column Studio Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Column: Activity Feed & Execution DAG (3 cols) */}
        <div className="md:col-span-3 border-r border-border bg-surface/30 p-4 flex flex-col min-h-0 overflow-hidden space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" /> Live Activity Feed
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono border-border">
              {run.events?.length || 0} Events
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono">
            {(run.events || []).map((ev: any) => (
              <div key={ev.id} className="p-3 rounded-xl border border-border/80 bg-background/80 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span className="text-accent font-bold">{ev.stage}</span>
                  <span>{new Date(ev.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-foreground text-[11px] leading-relaxed">{ev.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: Plan & Script Editor (6 cols) */}
        <div className="md:col-span-6 border-r border-border p-6 flex flex-col min-h-0 overflow-hidden space-y-6 bg-background">
          <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === "plan" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("plan")}
                className="text-xs font-bold font-mono"
              >
                Production Plan & Script
              </Button>
              <Button
                variant={activeTab === "tasks" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("tasks")}
                className="text-xs font-bold font-mono"
              >
                Task DAG Graph ({run.tasks?.length || 0})
              </Button>
            </div>

            {activeTab === "plan" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingPlan(!isEditingPlan)}
                className="text-xs font-mono border-border"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1" /> {isEditingPlan ? "Cancel Editing" : "Edit Script"}
              </Button>
            )}
          </div>

          {activeTab === "plan" ? (
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* Creative Brief Card */}
              <div className="p-5 rounded-2xl border border-border bg-surface/50 space-y-3">
                <h4 className="text-xs font-bold text-accent uppercase tracking-wider font-mono">Structured Creative Brief</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-muted block text-[10px]">PROJECT TYPE</span>
                    <span className="text-foreground font-bold">{plan.creativeBrief?.projectType}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">DURATION</span>
                    <span className="text-foreground font-bold">{plan.creativeBrief?.duration}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">ASPECT RATIO</span>
                    <span className="text-foreground font-bold">{plan.creativeBrief?.aspectRatio}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">VISUAL STYLE</span>
                    <span className="text-foreground font-bold">{plan.creativeBrief?.visualStyle}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">TONE</span>
                    <span className="text-foreground font-bold">{plan.creativeBrief?.tone}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">ESTIMATED COST</span>
                    <span className="text-accent font-bold">{plan.estimatedCredits} Credits</span>
                  </div>
                </div>
              </div>

              {/* Script Section */}
              <div className="p-5 rounded-2xl border border-border bg-surface/50 space-y-3">
                <h4 className="text-xs font-bold text-accent uppercase tracking-wider font-mono">Production Script</h4>
                {isEditingPlan ? (
                  <div className="space-y-3">
                    <textarea
                      rows={6}
                      value={editableScript}
                      onChange={(e) => setEditableScript(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-accent"
                    />
                    <Button size="sm" onClick={handleSavePlanEdits} className="bg-accent text-accent-foreground font-bold text-xs">
                      Save Script Changes
                    </Button>
                  </div>
                ) : (
                  <pre className="p-4 rounded-xl border border-border bg-background text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                    {plan.scriptText}
                  </pre>
                )}
              </div>

              {/* Planned Scenes & Shots */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-accent uppercase tracking-wider font-mono">Scene & Shot List</h4>
                {(plan.scenes || []).map((scene: any) => (
                  <div key={scene.sceneIndex} className="p-4 rounded-2xl border border-border bg-surface/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <h5 className="text-xs font-bold text-foreground">{scene.title}</h5>
                      <Badge variant="outline" className="text-[10px] font-mono text-muted">
                        {scene.location} · {scene.timeOfDay}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {(scene.shots || []).map((shot: any) => (
                        <div key={shot.shotNumber} className="p-3 rounded-xl border border-border/70 bg-background text-xs font-mono space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-muted">
                            <span className="text-accent font-bold">Shot {shot.shotNumber} · {shot.shotSize} ({shot.cameraMovement})</span>
                            <span>{shot.duration}</span>
                          </div>
                          <p className="text-foreground text-[11px] leading-relaxed">{shot.prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Task Graph DAG View */
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 font-mono text-xs">
              {(run.tasks || []).map((task: any) => (
                <div key={task.id} className="p-4 rounded-2xl border border-border bg-surface/50 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{task.type}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${
                          task.status === "COMPLETED"
                            ? "border-emerald-500 text-emerald-400"
                            : task.status === "RUNNING"
                            ? "border-accent text-accent animate-pulse"
                            : "border-border text-muted"
                        }`}
                      >
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted line-clamp-1">{task.input}</p>
                  </div>
                  <span className="text-accent font-bold text-xs">{task.estimatedCredits} cr</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Preview & Mid-Run Revisions Chat (3 cols) */}
        <div className="md:col-span-3 bg-surface/30 p-4 flex flex-col min-h-0 overflow-hidden space-y-4">
          {/* Cinema Preview Card */}
          <div className="space-y-2 shrink-0">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center gap-2">
              <Film className="h-4 w-4 text-accent" /> Cinema Live Preview
            </h3>
            <div className="relative aspect-video rounded-2xl border border-border overflow-hidden bg-background flex items-center justify-center group">
              <img
                src={samplePreviewUrl}
                alt="Cinema Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-10 w-10 text-accent" />
              </div>
            </div>
          </div>

          {/* Mid-Run Chat Panel */}
          <div className="flex-1 flex flex-col min-h-0 border border-border rounded-2xl bg-background p-3 space-y-3">
            <div className="border-b border-border pb-2">
              <h4 className="text-xs font-bold text-foreground font-mono flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Director Assistant Chat
              </h4>
              <p className="text-[10px] text-muted font-mono">
                Instruct mid-run changes e.g. "Make narrator voice male" or "Use cheaper models"
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono pr-1">
              <div className="p-2.5 rounded-xl bg-surface/60 border border-border/80 text-[11px] text-muted">
                AI Director listening for prompt revisions...
              </div>
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Instruct AI Director..."
                className="flex-1 rounded-xl border border-border bg-surface p-2 text-xs text-foreground placeholder:text-muted focus:ring-1 focus:ring-accent font-mono"
              />
              <Button type="submit" size="sm" disabled={isSendingChat} className="bg-accent text-accent-foreground font-bold">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Spending Safeguard Checkpoint Modal */}
      {isAwaitingApproval && (
        <Dialog open={isAwaitingApproval} onOpenChange={() => {}}>
          <DialogContent className="max-w-lg border-border bg-surface text-foreground rounded-3xl p-6 font-sans">
            <DialogHeader className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl font-extrabold text-foreground">
                Spending Safeguard Checkpoint
              </DialogTitle>
              <p className="text-xs text-muted font-mono leading-relaxed">
                AI Director generated a production plan. Please review estimated credit consumption before execution.
              </p>
            </DialogHeader>

            <div className="p-4 rounded-2xl border border-border bg-background space-y-3 font-mono text-xs my-2">
              <div className="flex justify-between items-center border-b border-border/60 pb-2">
                <span className="text-muted">Total Planned Shots</span>
                <span className="font-bold text-foreground">{plan.scenes?.reduce((sum: number, sc: any) => sum + sc.shots.length, 0) || 4} Shots</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/60 pb-2">
                <span className="text-muted">Selected Video Model</span>
                <span className="font-bold text-foreground">{plan.modelAssignments?.videoModel}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-1">
                <span className="text-accent">Estimated Credit Usage</span>
                <span className="text-accent">{plan.estimatedCredits || 48} Credits</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1 bg-accent text-accent-foreground font-bold text-xs h-11 rounded-xl cursor-pointer"
              >
                {isApproving ? "Submitting Production Tasks..." : "Approve & Produce Plan →"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="border-border text-xs font-mono h-11 rounded-xl cursor-pointer"
              >
                Cancel Production
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
