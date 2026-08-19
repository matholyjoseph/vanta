"use client";

import * as React from "react";
import Link from "next/link";
import { Users, ChevronDown, Plus, Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WorkspaceSwitcher({
  workspaces = [],
  activeWorkspaceId,
}: {
  workspaces: any[];
  activeWorkspaceId?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <div className="relative font-mono text-xs">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="border-border bg-surface hover:bg-surface-hover text-foreground font-bold h-10 px-3 flex items-center gap-2 rounded-xl"
      >
        <Users className="h-4 w-4 text-accent shrink-0" />
        <span className="truncate max-w-[130px]">
          {activeWorkspace ? activeWorkspace.name : "Personal Space"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted shrink-0" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-border bg-[#09090b] shadow-2xl p-2 z-50 space-y-1">
          <div className="px-3 py-1.5 text-[10px] text-muted uppercase font-bold tracking-wider">
            Workspaces
          </div>

          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface ${
              !activeWorkspaceId ? "text-accent font-bold bg-surface/60" : "text-foreground"
            }`}
          >
            <span className="truncate">Personal Space</span>
            {!activeWorkspaceId && <Check className="h-4 w-4 text-accent" />}
          </Link>

          {workspaces.map((w) => (
            <Link
              key={w.id}
              href={`/workspaces/${w.id}`}
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface ${
                activeWorkspaceId === w.id ? "text-accent font-bold bg-surface/60" : "text-foreground"
              }`}
            >
              <span className="truncate">{w.name}</span>
              {activeWorkspaceId === w.id && <Check className="h-4 w-4 text-accent" />}
            </Link>
          ))}

          <div className="border-t border-border pt-1 mt-1">
            <Link
              href="/workspaces/new"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-accent hover:bg-surface font-bold"
            >
              <Plus className="h-4 w-4" /> Create Workspace
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
