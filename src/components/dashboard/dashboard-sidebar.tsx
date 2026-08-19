"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clapperboard,
  LayoutDashboard,
  Film,
  FolderKanban,
  FolderOpen,
  Settings,
  HelpCircle,
  Code2,
  Plus,
  Shield,
  Sparkles,
  Smartphone,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "AI Director", href: "/director", icon: Sparkles },
    { label: "MCP & Agents", href: "/developers/mcp", icon: Bot },
    { label: "Developers", href: "/developers", icon: Code2 },
    { label: "Shorts Studio", href: "/shorts", icon: Smartphone },
    { label: "Video Editor", href: "/editor", icon: Clapperboard },
    { label: "Cinema Studio", href: "/cinema", icon: Clapperboard },
    { label: "Video Studio", href: "/studio/video", icon: Film },
    { label: "Projects", href: "/projects", icon: FolderKanban },
    { label: "Assets", href: "/assets", icon: FolderOpen },
    { label: "Pricing & Billing", href: "/pricing", icon: Settings },
    { label: "Admin Control", href: "/admin", icon: Shield },
  ];

  return (
    <aside className="w-64 border-r border-border bg-[#09090b] flex flex-col justify-between h-screen sticky top-0 shrink-0 hidden md:flex">
      <div className="p-4 space-y-6">
        {/* Brand Studio Header */}
        <div className="flex items-center space-x-3 px-2 py-1">
          <div className="p-2 rounded-xl bg-surface border border-border">
            <Clapperboard className="h-5 w-5 rotate-12 text-accent" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground">Studio</div>
            <div className="font-mono text-[10px] text-muted">Vanta Pro v2.4</div>
          </div>
        </div>

        {/* Create with AI Director CTA */}
        <Button
          asChild
          className="w-full bg-accent text-accent-foreground hover:bg-accent-hover font-bold justify-start px-4 h-11 shadow-sm"
        >
          <Link href="/director">
            <Sparkles className="mr-2 h-4 w-4" /> Create with AI Director
          </Link>
        </Button>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-surface text-accent font-semibold shadow-inner"
                    : "text-muted hover:text-foreground hover:bg-surface/50"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-accent" : "text-muted"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Items */}
      <div className="p-4 border-t border-border space-y-1">
        <Link
          href="/support"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono text-muted hover:text-foreground transition-colors"
        >
          <HelpCircle className="h-4 w-4" /> Support
        </Link>
        <Link
          href="/api-docs"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono text-muted hover:text-foreground transition-colors"
        >
          <Code2 className="h-4 w-4" /> API
        </Link>
      </div>
    </aside>
  );
}
