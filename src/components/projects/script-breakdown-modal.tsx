"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { breakdownScriptAction, applyScriptBreakdownAction } from "@/app/actions/projects";
import { useToast } from "@/components/ui/toast";
import { Wand2, Loader2, Check, Film } from "lucide-react";
import { ProposedScene } from "@/lib/services/script-breakdown";

interface ScriptBreakdownModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ScriptBreakdownModal({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: ScriptBreakdownModalProps) {
  const { showToast } = useToast();
  const [scriptText, setScriptText] = React.useState("");
  const [isParsing, setIsParsing] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [proposedScenes, setProposedScenes] = React.useState<ProposedScene[] | null>(null);

  const handleBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptText.trim()) return;

    setIsParsing(true);
    try {
      const scenes = await breakdownScriptAction(scriptText);
      setProposedScenes(scenes);
      showToast(`Parsed script into ${scenes.length} scenes`, "success");
    } catch {
      showToast("Failed to parse script", "error");
    } finally {
      setIsParsing(false);
    }
  };

  const handleApprove = async () => {
    if (!proposedScenes) return;

    setIsApplying(true);
    try {
      await applyScriptBreakdownAction(projectId, scriptText);
      showToast("Script breakdown applied to project timeline!", "success");
      onOpenChange(false);
      setProposedScenes(null);
      setScriptText("");
      if (onSuccess) onSuccess();
    } catch {
      showToast("Failed to apply script breakdown", "error");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-surface border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-accent" /> Script-to-Scenes AI Parser
          </DialogTitle>
          <DialogDescription className="text-muted text-sm mt-1">
            Paste your screenplay text or scene notes. The parser will structure it into scenes and suggested shot prompts.
          </DialogDescription>
        </DialogHeader>

        {proposedScenes ? (
          /* Preview & Approve Output */
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs font-mono text-muted">
              <span>PROPOSED BREAKDOWN ({proposedScenes.length} SCENES)</span>
              <button
                type="button"
                onClick={() => setProposedScenes(null)}
                className="text-accent hover:underline"
              >
                ← Edit Raw Script
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {proposedScenes.map((sc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <div className="flex items-center justify-between font-bold text-sm text-accent">
                    <span>{sc.title}</span>
                    <span className="font-mono text-xs text-muted">{sc.shots.length} Shots</span>
                  </div>
                  <p className="text-xs text-muted italic">{sc.description}</p>

                  <div className="space-y-1.5 pt-1">
                    {sc.shots.map((sh, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2 rounded bg-surface border border-border/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
                          <Film className="h-3.5 w-3.5 text-accent" />
                          <span className="font-bold text-foreground">{sh.shotNumber}</span>
                          <span className="truncate max-w-md font-sans text-foreground/90">
                            {sh.prompt}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-muted">{sh.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApplying}
                className="bg-accent text-accent-foreground font-bold"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Approve & Import to Timeline
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Input Script Form */
          <form onSubmit={handleBreakdown} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                PASTE RAW SCREENPLAY / TEXT
              </label>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={8}
                placeholder={`INT. CYBERPUNK LAB - NIGHT\nA wide shot of @Lab interior showing neon green matrix screens.\nClose-up of @Kael adjusting holographic lens overlay.\n\nEXT. CITY STREET - CONTINUOUS\nHover car speeds through heavy rain...`}
                className="w-full rounded-xl border border-border bg-background p-4 text-xs font-mono text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/80 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isParsing || !scriptText.trim()}
                className="bg-accent text-accent-foreground font-bold"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" /> Break Into Scenes
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
