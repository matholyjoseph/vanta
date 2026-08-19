import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, BookOpen, Film, Sparkles, MessageSquare, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Help Center — VANTA AI",
  description: "Documentation, guides, and tutorials for VANTA AI creators.",
};

export default function HelpPage() {
  const sections = [
    { icon: Film, title: "Getting Started & Video Studio", desc: "Learn how to orchestrate multi-model video generations." },
    { icon: Sparkles, title: "AI Director / Agent Mode", desc: "Command automatic multi-shot production from natural language." },
    { icon: MessageSquare, title: "Team Collaboration & Workspaces", desc: "Invite members, leave timestamped video comments, and approve cuts." },
    { icon: CreditCard, title: "Credits & Subscription Plans", desc: "Understand model credit costs, top-ups, and billing cycles." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 max-w-5xl mx-auto space-y-8 font-sans">
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <HelpCircle className="h-7 w-7 text-accent" /> Help Center & Documentation
          </h1>
        </div>

        <Link href="/support">
          <Button className="bg-accent text-accent-foreground font-bold text-xs h-10 px-5">
            Submit Support Ticket
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        {sections.map((s) => (
          <div key={s.title} className="p-6 rounded-3xl border border-border bg-surface/50 space-y-3 shadow-xl">
            <s.icon className="h-6 w-6 text-accent" />
            <h3 className="text-base font-bold text-foreground">{s.title}</h3>
            <p className="text-muted text-xs font-sans">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
