"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TestModeBanner({ isGuest = false }: { isGuest?: boolean }) {
  if (!isGuest) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs font-mono text-amber-200">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-amber-500 text-amber-400 font-bold px-1.5 py-0">
          TEST MODE
        </Badge>
        <span>You are using temporary Guest Test Mode with 100 Test Credits.</span>
      </div>

      <Link href="/auth?mode=signup">
        <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-bold h-7 px-3 text-[11px] rounded-lg">
          Create Free Account to Save Work <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}
