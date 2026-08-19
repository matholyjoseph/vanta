"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Clapperboard,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewProjectModal } from "@/components/dashboard/new-project-modal";
import {
  renameProjectAction,
  duplicateProjectAction,
  deleteProjectAction,
} from "@/app/actions/projects";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  sceneCount: number;
  updatedAt: Date;
}

interface ProjectListClientProps {
  initialProjects: ProjectItem[];
}

export function ProjectListClient({ initialProjects }: ProjectListClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [projects, setProjects] = React.useState<ProjectItem[]>(initialProjects);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"updatedAt" | "name">("updatedAt");
  const [newProjectOpen, setNewProjectOpen] = React.useState(false);

  // Rename Dialog State
  const [renameTarget, setRenameTarget] = React.useState<ProjectItem | null>(null);
  const [newName, setNewName] = React.useState("");

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = React.useState<ProjectItem | null>(null);

  // Active Dropdown Menu State
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  // Filter & Sort projects
  const filteredProjects = React.useMemo(() => {
    return projects
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [projects, searchQuery, sortBy]);

  // Rename Handler
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !newName.trim()) return;

    try {
      const updated = await renameProjectAction(renameTarget.id, newName);
      setProjects((prev) =>
        prev.map((p) => (p.id === renameTarget.id ? { ...p, name: updated.name } : p))
      );
      showToast(`Renamed project to "${updated.name}"`, "success");
      setRenameTarget(null);
    } catch {
      showToast("Failed to rename project", "error");
    }
  };

  // Duplicate Handler
  const handleDuplicate = async (projectId: string) => {
    try {
      const duplicated = await duplicateProjectAction(projectId);
      setProjects((prev) => [
        {
          id: duplicated.id,
          name: duplicated.name,
          description: duplicated.description,
          status: duplicated.status,
          sceneCount: duplicated.sceneCount,
          updatedAt: duplicated.updatedAt,
        },
        ...prev,
      ]);
      showToast(`Duplicated project "${duplicated.name}"`, "success");
      setActiveMenuId(null);
    } catch {
      showToast("Failed to duplicate project", "error");
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteProjectAction(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast(`Deleted project "${deleteTarget.name}"`, "info");
      setDeleteTarget(null);
      setActiveMenuId(null);
    } catch {
      showToast("Failed to delete project", "error");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <FolderKanban className="h-8 w-8 text-accent" /> Cinema Projects
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage your multi-scene AI video sequences and storyboards.
          </p>
        </div>

        <Button
          onClick={() => setNewProjectOpen(true)}
          className="bg-accent text-accent-foreground hover:bg-accent-hover font-bold"
        >
          <Plus className="mr-2 h-4 w-4" /> Create New Project
        </Button>
      </div>

      {/* Filter & Sort Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/80"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-mono text-muted">
          <span>SORT BY:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "updatedAt" | "name")}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none text-xs font-mono"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="name">Project Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center text-muted">
            <Clapperboard className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">No Projects Found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {searchQuery
                ? `No projects matching "${searchQuery}"`
                : "Create your first multi-scene project to start storyboarding."}
            </p>
          </div>
          <Button
            onClick={() => setNewProjectOpen(true)}
            className="bg-accent text-accent-foreground font-bold"
          >
            + Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="group relative overflow-hidden rounded-2xl bg-surface border border-border p-6 transition-all hover:border-accent/50 hover:shadow-[0_0_25px_rgba(200,255,0,0.1)] flex flex-col justify-between h-56 cursor-pointer"
            >
              {/* Top Row: Icon + Dropdown Menu */}
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-surface-hover border border-border group-hover:border-accent/40 group-hover:text-accent text-muted transition-colors">
                  <Clapperboard className="h-6 w-6" />
                </div>

                <div
                  className="relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      setActiveMenuId(activeMenuId === project.id ? null : project.id)
                    }
                    className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {activeMenuId === project.id && (
                    <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-border bg-background shadow-2xl p-1 text-xs space-y-0.5">
                      <button
                        onClick={() => {
                          setRenameTarget(project);
                          setNewName(project.name);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted hover:text-foreground hover:bg-surface text-left"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Rename
                      </button>
                      <button
                        onClick={() => handleDuplicate(project.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted hover:text-foreground hover:bg-surface text-left"
                      >
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(project);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 text-left font-medium"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 my-auto">
                <h3 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors truncate">
                  {project.name}
                </h3>
                <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                  {project.description || "Multi-scene cinema storyboard sequence."}
                </p>
              </div>

              {/* Bottom Specs Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-[11px] font-mono text-muted">
                <span>❖ {project.sceneCount} {project.sceneCount === 1 ? "Scene" : "Scenes"}</span>
                <span className="flex items-center gap-1 text-foreground font-semibold group-hover:text-accent transition-colors">
                  Open Studio <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      {renameTarget && (
        <Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
          <DialogContent className="max-w-md bg-surface border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Rename Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRename} className="space-y-4 pt-2">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent text-accent-foreground font-bold">
                  Save
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-md bg-surface border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-destructive">
                Delete Project?
              </DialogTitle>
              <DialogDescription className="text-muted text-sm mt-1">
                Are you sure you want to delete &ldquo;{deleteTarget.name}&rdquo;? This will delete all associated scenes and shots.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleDelete} className="bg-destructive text-white font-bold">
                Confirm Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Project Modal */}
      <NewProjectModal open={newProjectOpen} onOpenChange={setNewProjectOpen} />
    </div>
  );
}
