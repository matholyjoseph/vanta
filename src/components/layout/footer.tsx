import Link from "next/link";
import { Clapperboard, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SITE_CONFIG, FOOTER_SECTIONS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer id="footer" className="w-full bg-background border-t border-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column (Spans 2 columns on desktop for perfect balance) */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            <Link href="/" className="flex items-center space-x-2 w-fit">
              <Clapperboard className="h-6 w-6 rotate-12 text-accent" />
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                Vanta AI
              </span>
            </Link>
            <p className="text-sm text-muted max-w-sm leading-relaxed font-sans">
              The professional multi-model AI video workspace. Orchestrate cinematic video generation with precision controls and commercial rights.
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-xs text-muted">
              <Badge variant="outline" className="bg-surface text-accent border-accent/30 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-accent mr-1.5 animate-pulse" />
                Vanta Engine v2.4
              </Badge>
              <span className="text-muted-foreground">·</span>
              <span>Commercial License Active</span>
            </div>
          </div>

          {/* Link Sections (3 columns) */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="flex flex-col space-y-4">
              <h4 className="font-bold text-foreground text-sm tracking-wider uppercase font-mono">
                {section.title}
              </h4>
              <ul className="flex flex-col space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-accent transition-colors font-sans"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-border/80" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-muted">
          <p>© 2024 {SITE_CONFIG.name}. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link href="/pricing" className="hover:text-accent transition-colors">
              Pricing Plans
            </Link>
            <Link href="/auth?mode=signup" className="hover:text-accent transition-colors flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-accent" /> Open Studio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
