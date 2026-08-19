"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Film,
  Cpu,
  Radio,
  Tag,
  Zap,
  CreditCard,
  Receipt,
  FolderGit2,
  HardDrive,
  Workflow,
  ShieldAlert,
  Ticket,
  BarChart3,
  Sliders,
  History,
  Menu,
  X,
  Search,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface AdminNavSubitem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const ADMIN_NAV_ITEMS: AdminNavSubitem[] = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Generations", href: "/admin/generations", icon: Film },
  { label: "AI Models", href: "/admin/models", icon: Cpu },
  { label: "Providers", href: "/admin/providers", icon: Radio },
  { label: "Pricing", href: "/admin/pricing", icon: Tag },
  { label: "Credits", href: "/admin/credits", icon: Zap },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Payments", href: "/admin/payments", icon: Receipt },
  { label: "Assets", href: "/admin/assets", icon: FolderGit2 },
  { label: "Storage", href: "/admin/storage", icon: HardDrive },
  { label: "Background Jobs", href: "/admin/jobs", icon: Workflow },
  { label: "Moderation Queue", href: "/admin/moderation", icon: ShieldAlert },
  { label: "Promo Codes", href: "/admin/coupons", icon: Ticket },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings & Flags", href: "/admin/settings", icon: Sliders },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

export function AdminLayout({
  children,
  userRole = "SUPER_ADMIN",
  userName = "Admin User",
  userEmail = "admin@vanta.ai",
}: AdminLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const isSuperAdmin = userRole === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans">
      {/* Desktop Sidebar (Left Column) */}
      <aside className="w-64 border-r border-border bg-[#09090b] flex flex-col h-screen shrink-0 hidden lg:flex">
        {/* Brand Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent text-accent-foreground font-extrabold flex items-center justify-center font-mono text-sm shadow-md">
              V
            </div>
            <div>
              <span className="font-extrabold text-sm text-foreground tracking-tight block">
                VANTA AI
              </span>
              <span className="text-[10px] font-mono text-accent uppercase font-bold tracking-widest block">
                CONTROL CENTER
              </span>
            </div>
          </Link>
          <Badge
            variant="outline"
            className={`text-[9px] font-mono font-bold ${
              isSuperAdmin
                ? "bg-accent/10 text-accent border-accent/40"
                : "bg-surface text-muted border-border"
            }`}
          >
            {userRole}
          </Badge>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                  isActive
                    ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-accent" : "text-muted group-hover:text-foreground"}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-border bg-surface/50 space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center text-xs shrink-0 font-mono">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-foreground truncate">{userName}</div>
              <div className="text-[10px] font-mono text-muted truncate">{userEmail}</div>
            </div>
          </div>

          <Link href="/studio/video" className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[11px] font-mono border-border text-muted hover:text-foreground justify-center h-8"
            >
              Back to Studio <ExternalLink className="ml-1.5 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-[#09090b]/80 backdrop-blur px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search Bar */}
            <div className="relative w-64 md:w-80 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Global admin search (Users, Generations, Jobs...)"
                className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-1.5 text-xs font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-xs text-muted">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="hidden md:inline">RBAC Authenticated</span>
            </div>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 font-mono text-xs">
              {userRole}
            </Badge>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {children}
        </main>
      </div>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-[#09090b] border-border p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="font-bold text-foreground text-sm flex items-center gap-2 font-mono">
              <div className="w-7 h-7 rounded-lg bg-accent text-accent-foreground font-extrabold flex items-center justify-center text-xs">
                V
              </div>
              VANTA CONTROL CENTER
            </SheetTitle>
          </SheetHeader>
          <nav className="p-3 space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                    isActive
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  <Icon className="h-4 w-4 text-muted" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
