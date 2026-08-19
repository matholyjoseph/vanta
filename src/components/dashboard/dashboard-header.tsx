"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Search, Bell, Sparkles, LayoutDashboard, User, CreditCard, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  creditBalance?: number;
  userName?: string;
  userEmail?: string;
}

export function DashboardHeader({
  creditBalance = 2450,
  userName,
  userEmail,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitials = (userName || userEmail || "CR")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 gap-4">
        {/* Left Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, assets, or prompts..."
              className="w-full rounded-lg border border-border/80 bg-surface/60 pl-10 pr-12 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/80 focus:border-accent transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Action & Profile Items */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Credits Balance Pill */}
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-mono font-semibold text-accent hover:bg-accent/20 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>{creditBalance.toLocaleString()}</span>
            <span className="text-[10px] text-accent/80 hidden sm:inline">CREDITS</span>
          </Link>

          {/* Buy Credits Button */}
          <Button
            asChild
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent-hover font-semibold hidden sm:inline-flex"
          >
            <Link href="/pricing">Buy Credits</Link>
          </Button>

          {/* Notifications Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Profile Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center font-mono text-xs font-bold text-accent shrink-0 hover:border-accent/60 transition-colors cursor-pointer"
              aria-label="User Profile Options"
            >
              {userInitials}
            </button>

            {/* Profile Dropdown Popover */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface shadow-2xl py-2 z-50 divide-y divide-border/60 text-xs font-sans">
                {/* User Header */}
                <div className="px-4 py-3 space-y-1">
                  <div className="font-bold text-foreground truncate">{userName || "Creator"}</div>
                  <div className="text-[10px] font-mono text-muted truncate">{userEmail || "creator@vanta.ai"}</div>
                </div>

                {/* Main Links */}
                <div className="py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-foreground hover:bg-surface-hover hover:text-accent transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted" /> Dashboard
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-foreground hover:bg-surface-hover hover:text-accent transition-colors"
                  >
                    <User className="h-4 w-4 text-muted" /> Account Settings
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-foreground hover:bg-surface-hover hover:text-accent transition-colors"
                  >
                    <CreditCard className="h-4 w-4 text-muted" /> Billing & Plans
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-foreground hover:bg-surface-hover hover:text-accent transition-colors"
                  >
                    <Shield className="h-4 w-4 text-muted" /> Admin Control
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="pt-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-destructive hover:bg-destructive/10 transition-colors text-left font-semibold cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
