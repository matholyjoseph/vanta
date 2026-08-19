"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createProjectElementAction } from "@/app/actions/projects";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

interface NewElementModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "CHARACTER" | "LOCATION" | "PROP" | "STYLE";
  onSuccess?: () => void;
}

export function NewElementModal({
  projectId,
  open,
  onOpenChange,
  defaultType = "CHARACTER",
  onSuccess,
}: NewElementModalProps) {
  const { showToast } = useToast();
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<"CHARACTER" | "LOCATION" | "PROP" | "STYLE">(defaultType);
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const el = await createProjectElementAction(projectId, {
        name: name.trim(),
        type,
        description: description.trim() || undefined,
      });

      showToast(`Element "@${el.name}" added to project!`, "success");
      onOpenChange(false);
      setName("");
      setDescription("");
      if (onSuccess) onSuccess();
    } catch {
      showToast("Failed to create element", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Add Project Element
          </DialogTitle>
          <DialogDescription className="text-muted text-sm mt-1">
            Create reusable characters, locations, props, or style references for your shot prompts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              ELEMENT TYPE
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "CHARACTER" | "LOCATION" | "PROP" | "STYLE")}
              className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/80 font-mono"
            >
              <option value="CHARACTER">Character (@CharacterName)</option>
              <option value="LOCATION">Location (@LocationName)</option>
              <option value="PROP">Prop (@PropName)</option>
              <option value="STYLE">Style Reference (@StyleName)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              ELEMENT NAME (e.g. Maya)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-accent text-sm font-bold">
                @
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full rounded-md border border-border bg-background pl-8 pr-3.5 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/80"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              DESCRIPTION / VISUAL DIRECTIVES
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Visual attributes, attire, lighting preferences..."
              className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/80 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 bg-accent text-accent-foreground font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Element"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
