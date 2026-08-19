"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Clapperboard, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MobileNav from "./mobile-nav";
import { TestModeBanner } from "./test-mode-banner";
import { NAV_ITEMS } from "@/lib/constants";
import { getActorContextAction } from "@/app/actions/test-generation-actions";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [actor, setActor] = React.useState<any>({ isGuest: true, testCredits: 100 });

  React.useEffect(() => {
    getActorContextAction().then(setActor).catch(() => {});
  }, []);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.includes("#")) {
      const targetId = href.split("#")[1];
      if (pathname === "/") {
        e.preventDefault();
        const elem = document.getElementById(targetId);
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  return (
    <>
      <TestModeBanner isGuest={actor.isGuest} />
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <a
          href="#main-content"
          className="absolute left-0 top-0 z-50 -translate-y-full bg-[#c8ff00] p-2 text-black font-medium transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8 mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <Clapperboard className="h-6 w-6 rotate-12 text-[#c8ff00]" />
              <span className="font-bold sm:inline-block text-foreground text-lg">
                Vanta AI
              </span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleScroll(e, item.href)}
                  className="transition-colors hover:text-[#c8ff00] text-muted-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-4">
              {/* Test Credits Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 font-mono text-xs text-amber-200">
                <Badge variant="outline" className="border-amber-500 text-amber-400 font-bold px-1 py-0 text-[9px]">
                  TEST
                </Badge>
                <span className="font-bold">{actor.testCredits} Credits</span>
              </div>

              <Button
                asChild
                className="bg-[#c8ff00] text-black hover:bg-[#a6d900] font-bold text-xs h-9 px-4 rounded-xl cursor-pointer"
              >
                <Link href="/dashboard">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Try VANTA Free
                </Link>
              </Button>

              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Link
                href="/dashboard"
                className="h-8 w-8 rounded-full bg-surface flex items-center justify-center overflow-hidden border border-border hover:border-accent/50 transition-colors"
              >
                <span className="text-xs font-mono font-bold text-accent">G</span>
              </Link>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-foreground hover:bg-surface"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </div>
        </div>
        
        <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      </header>
    </>
  );
}
