"use client";

import * as React from "react";
import Link from "next/link";
import { Terminal, Play, Send, Code2, Copy, Check, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export function PlaygroundClient() {
  const { showToast } = useToast();

  const [endpoint, setEndpoint] = React.useState("/api/v1/generations");
  const [method, setMethod] = React.useState("POST");
  const [environment, setEnvironment] = React.useState("TEST");

  const [requestBody, setRequestBody] = React.useState(
    JSON.stringify(
      {
        model: "vanta-cinema-pro",
        mode: "text-to-video",
        prompt: "A cinematic sports car driving through a futuristic city at night, 4k volumetric lighting",
        duration: 5,
        aspect_ratio: "16:9",
        resolution: "1080p",
      },
      null,
      2
    )
  );

  const [responseStatus, setResponseStatus] = React.useState<number | null>(null);
  const [responseBody, setResponseBody] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseBody("");

    const startTime = Date.now();
    try {
      // Execute test call through test route
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer vanta_test_demo_key_9999",
          "Idempotency-Key": `playground_${Date.now()}`,
        },
        body: method === "POST" ? requestBody : undefined,
      });

      const data = await res.json();
      setResponseStatus(res.status);
      setResponseBody(JSON.stringify(data, null, 2));
      showToast(`Request executed (${res.status} in ${Date.now() - startTime}ms)`, "success");
    } catch (err: any) {
      setResponseStatus(500);
      setResponseBody(JSON.stringify({ error: err?.message || "Execution failed" }, null, 2));
      showToast("Execution failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground p-6 md:p-10 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <Link href="/developers" className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
            ← Developer Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Terminal className="h-7 w-7 text-accent" /> API Interactive Testing Sandbox
          </h1>
        </div>

        <Badge variant="outline" className="border-accent text-accent font-mono text-xs">
          {environment} ENVIRONMENT
        </Badge>
      </div>

      {/* 2-Column Playground Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        {/* Left: Request Editor */}
        <div className="p-5 rounded-2xl border border-border bg-surface/50 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-bold text-foreground flex items-center gap-2">
                <Code2 className="h-4 w-4 text-accent" /> Request Configuration
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="bg-background border border-border rounded-lg px-2 py-1 font-bold text-accent"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="bg-background border border-border rounded-lg px-2 py-1 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-muted text-[10px] uppercase">JSON Request Body</label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={14}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <Button
            onClick={handleExecute}
            disabled={isLoading}
            className="w-full bg-accent text-accent-foreground font-bold text-xs h-11 rounded-xl cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-spin" /> Executing REST Call...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" /> Send REST API Request
              </span>
            )}
          </Button>
        </div>

        {/* Right: Response Inspector */}
        <div className="p-5 rounded-2xl border border-border bg-surface/50 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-bold text-foreground">Response Output</span>
              {responseStatus && (
                <Badge
                  variant="outline"
                  className={responseStatus < 300 ? "border-green-500 text-green-400" : "border-destructive text-destructive"}
                >
                  HTTP {responseStatus}
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-muted text-[10px] uppercase">Response Payload</label>
              <pre className="w-full min-h-[340px] max-h-[420px] rounded-xl border border-border bg-background p-4 text-xs font-mono text-accent overflow-auto">
                {responseBody || "// Press Send REST API Request to view response"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
