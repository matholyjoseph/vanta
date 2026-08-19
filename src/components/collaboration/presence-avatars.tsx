"use client";

import * as React from "react";
import { User, Eye, Edit3, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ActiveMember {
  userId: string;
  name: string;
  status: "VIEWING" | "EDITING" | "REVIEWING";
}

export function PresenceAvatars({ members = [] }: { members: ActiveMember[] }) {
  if (members.length === 0) return null;

  return (
    <div className="flex items-center space-x-1.5 font-mono text-xs">
      <span className="text-[10px] text-muted uppercase font-bold mr-1 hidden sm:inline">Active Now:</span>
      {members.map((m) => (
        <div
          key={m.userId}
          title={`${m.name} is currently ${m.status.toLowerCase()}`}
          className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface text-foreground shadow-sm"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-bold text-[11px]">{m.name}</span>
          <Badge
            variant="outline"
            className="text-[9px] px-1 py-0 border-accent text-accent uppercase"
          >
            {m.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
