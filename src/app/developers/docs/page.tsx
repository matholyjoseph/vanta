import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Terminal, Code2, Copy, Check, FileText, Key, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "API Documentation — Developer Portal",
  description: "Official REST API reference and quick start documentation for VANTA AI.",
};

export default function DocsPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-10 max-w-7xl mx-auto font-sans">
        {/* Header */}
        <div className="border-b border-border pb-6 flex items-center justify-between">
          <div>
            <Link href="/developers" className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
              ← Developer Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <FileText className="h-7 w-7 text-accent" /> API Reference & Documentation
            </h1>
            <p className="text-sm text-muted mt-1 font-mono">
              Complete REST API specification, authentication, and SDK examples.
            </p>
          </div>

          <Link href="/api/openapi.json" target="_blank">
            <Button variant="outline" className="border-border font-mono text-xs">
              <Code2 className="h-4 w-4 mr-2 text-accent" /> OpenAPI 3.0 Spec
            </Button>
          </Link>
        </div>

        {/* Documentation Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 font-sans">
          {/* Left Subnav */}
          <div className="md:col-span-3 space-y-2 font-mono text-xs">
            <a href="#quick-start" className="block p-2 rounded-xl bg-surface/80 font-bold text-accent">
              1. Quick Start
            </a>
            <a href="#authentication" className="block p-2 rounded-xl text-muted hover:text-foreground">
              2. Authentication
            </a>
            <a href="#generations" className="block p-2 rounded-xl text-muted hover:text-foreground">
              3. Generations API
            </a>
            <a href="#models" className="block p-2 rounded-xl text-muted hover:text-foreground">
              4. Stable Models
            </a>
            <a href="#webhooks" className="block p-2 rounded-xl text-muted hover:text-foreground">
              5. Webhooks & Signatures
            </a>
          </div>

          {/* Main Docs Content */}
          <div className="md:col-span-9 space-y-8 font-sans">
            {/* Quick Start Section */}
            <section id="quick-start" className="space-y-4 border-b border-border pb-8">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                Quick Start Example (cURL)
              </h2>
              <pre className="p-4 rounded-2xl border border-border bg-[#09090b] text-accent font-mono text-xs overflow-x-auto">
{`curl -X POST https://vanta.ai/api/v1/generations \\
  -H "Authorization: Bearer $VANTA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: demo_12345" \\
  -d '{
    "model": "vanta-cinema-pro",
    "mode": "text-to-video",
    "prompt": "A cinematic sports car driving through a futuristic city at night",
    "duration": 5,
    "aspect_ratio": "16:9",
    "resolution": "1080p"
  }'`}
              </pre>
            </section>

            {/* JavaScript/TypeScript Example */}
            <section id="generations" className="space-y-4 border-b border-border pb-8">
              <h2 className="text-xl font-bold text-foreground">JavaScript / TypeScript Client</h2>
              <pre className="p-4 rounded-2xl border border-border bg-[#09090b] text-foreground font-mono text-xs overflow-x-auto">
{`const response = await fetch("https://vanta.ai/api/v1/generations", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.VANTA_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "vanta-cinema-pro",
    prompt: "Cyberpunk metropolis at night",
    aspect_ratio: "16:9",
  }),
});

const data = await response.json();
console.log("Generation Queued ID:", data.id);`}
              </pre>
            </section>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
