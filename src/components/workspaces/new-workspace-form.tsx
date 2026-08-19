"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createWorkspaceAction } from "@/app/actions/workspace-actions";
import { useToast } from "@/components/ui/toast";

export function NewWorkspaceForm() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const workspace = await createWorkspaceAction({ name, description });
      showToast("Workspace created successfully!", "success");
      router.push(`/workspaces/${workspace.id}`);
    } catch (err: any) {
      showToast(err?.message || "Failed to create workspace", "error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg p-8 rounded-3xl border border-border bg-surface shadow-2xl space-y-6">
      <Link href="/workspaces" className="text-muted hover:text-foreground font-mono text-xs block mb-2">
        ← Back to Workspaces
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
          <Users className="h-6 w-6 text-accent" /> Create New Workspace
        </h1>
        <p className="text-xs text-muted font-mono">
          Collaborate on shared AI cinema projects, assets, and generations with your team.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        <div className="space-y-1">
          <label className="font-bold text-foreground block uppercase text-[10px]">Workspace Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Creative Studio"
            className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-foreground block uppercase text-[10px]">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Commercial video production workspace..."
            rows={3}
            className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:ring-1 focus:ring-accent"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="w-full bg-accent text-accent-foreground font-bold text-xs h-11 rounded-xl cursor-pointer"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin" /> Creating Workspace...
            </span>
          ) : (
            "Create Workspace"
          )}
        </Button>
      </form>
    </div>
  );
}
