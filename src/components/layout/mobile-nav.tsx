"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Clapperboard, Sparkles, User, Settings, CreditCard, LogOut, LayoutDashboard, Film, FolderKanban, FolderOpen, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const isAuthenticated = !!session?.user;

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="border-border bg-background flex flex-col w-[300px] sm:w-[360px]">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>
            <Link
              href="/"
              className="flex items-center space-x-2"
              onClick={handleLinkClick}
            >
              <Clapperboard className="h-6 w-6 rotate-12 text-accent" />
              <span className="font-extrabold text-foreground text-lg">
                Vanta AI
              </span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col justify-between flex-1 py-4 overflow-y-auto space-y-6">
          {/* Main Navigation Links */}
          <nav className="flex flex-col space-y-2 font-mono text-sm">
            <Link
              href="/dashboard"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                pathname === "/dashboard" ? "bg-surface text-accent font-bold" : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 text-accent" /> Dashboard
            </Link>

            <Link
              href="/studio/video"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                pathname.startsWith("/studio") ? "bg-surface text-accent font-bold" : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Film className="h-4 w-4 text-accent" /> Generate Video
            </Link>

            <Link
              href="/projects"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                pathname.startsWith("/projects") ? "bg-surface text-accent font-bold" : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <FolderKanban className="h-4 w-4 text-accent" /> Projects
            </Link>

            <Link
              href="/assets"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                pathname.startsWith("/assets") ? "bg-surface text-accent font-bold" : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <FolderOpen className="h-4 w-4 text-accent" /> Asset Library
            </Link>

            <Link
              href="/pricing"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                pathname === "/pricing" ? "bg-surface text-accent font-bold" : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <CreditCard className="h-4 w-4 text-accent" /> Pricing & Plans
            </Link>
          </nav>

          <Separator className="bg-border" />

          {/* User & Credits Section */}
          <div className="space-y-4 font-mono text-xs">
            {/* Credit Balance Indicator */}
            <div className="p-3.5 rounded-xl border border-accent/30 bg-accent/10 flex items-center justify-between">
              <span className="text-accent font-bold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> 2,450 CREDITS
              </span>
              <Link href="/pricing" onClick={handleLinkClick} className="text-[10px] text-accent underline">
                Buy More
              </Link>
            </div>

            {isAuthenticated ? (
              <div className="space-y-2 pt-2">
                <div className="px-3 text-[10px] uppercase text-muted">ACCOUNT</div>
                <Link
                  href="/account"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground hover:bg-surface hover:text-accent transition-colors"
                >
                  <User className="h-4 w-4 text-muted" /> Profile & Settings
                </Link>
                <Link
                  href="/pricing"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground hover:bg-surface hover:text-accent transition-colors"
                >
                  <CreditCard className="h-4 w-4 text-muted" /> Billing & Usage
                </Link>
                <Link
                  href="/admin"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground hover:bg-surface hover:text-accent transition-colors"
                >
                  <Shield className="h-4 w-4 text-muted" /> Admin Control
                </Link>

                <button
                  onClick={() => {
                    handleLinkClick();
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-left font-bold cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Button variant="outline" className="w-full text-xs font-mono" asChild>
                  <Link href="/auth/login" onClick={handleLinkClick}>
                    Sign In
                  </Link>
                </Button>
                <Button className="w-full text-xs font-mono bg-accent text-accent-foreground hover:bg-accent-hover font-bold" asChild>
                  <Link href="/auth/signup" onClick={handleLinkClick}>
                    Create Account
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
