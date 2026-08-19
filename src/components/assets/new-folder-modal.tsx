"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createAssetFolderAction } from "@/app/actions/assets";
import { useToast } from "@/components/ui/toast";
import { FolderPlus, Loader2 } from "lucide-react";

interface NewFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewFolderModal({ open, onOpenChange, onSuccess }: NewFolderModalProps) {
  const { showToast } = useToast();
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#c8ff00");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const folder = await createAssetFolderAction(name, color);
      showToast(`Created folder "${folder.name}"`, "success");
      onOpenChange(false);
      setName("");
      if (onSuccess) onSuccess();
    } catch {
      showToast("Failed to create folder", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-accent" /> Create Asset Folder
          </DialogTitle>
          <DialogDescription className="text-muted text-sm mt-1">
            Organize your generated clips, reference assets, and uploads.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              FOLDER NAME
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cyberpunk Characters"
              className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              FOLDER ACCENT COLOR
            </label>
            <div className="flex items-center gap-3">
              {["#c8ff00", "#3b82f6", "#ec4899", "#10b981", "#8b5cf6", "#f59e0b"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-accent text-accent-foreground font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
