"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bot,
  Play,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  Layers,
  Trash2,
  Terminal,
  Cpu,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  runMockMcpTestSuiteAction,
  revokeMcpConnectionAction,
} from "@/app/actions/mcp-actions";
import { useToast } from "@/components/ui/toast";

export function McpDashboardClient({
  initialConnections = [],
  initialSessionLogs = [],
}: {
  initialConnections: any[];
  initialSessionLogs: any[];
}) {
  const { showToast } = useToast();
  const [connections, setConnections] = React.useState(initialConnections);
  const [sessionLogs, setSessionLogs] = React.useState(initialSessionLogs);
  const [testResults, setTestResults] = React.useState<any[] | null>(null);
  const [isRunningTests, setIsRunningTests] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const mcpServerUrl = typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "http://localhost:3000/api/mcp";

  const handleRunMockTests = async () => {
    setIsRunningTests(true);
    showToast("Running MockMcpClient automated integration test suite...", "info");
    try {
      const results = await runMockMcpTestSuiteAction();
      setTestResults(results);
      showToast(`Automated test suite finished: ${results.filter((r) => r.status === "PASSED").length} passed`, "success");
    } catch (err: any) {
      showToast(err?.message || "Mock test suite failed", "error");
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRevoke = async (connId: string) => {
    try {
      await revokeMcpConnectionAction(connId);
      setConnections(connections.map((c) => (c.id === connId ? { ...c, status: "REVOKED" } : c)));
      showToast("Agent connection revoked", "info");
    } catch (err: any) {
      showToast(err?.message || "Failed to revoke connection", "error");
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(mcpServerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Copied MCP Endpoint URL to clipboard!", "success");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link href="/developers" className="text-muted hover:text-foreground font-mono text-xs mb-1 block">
            ← Developer Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Bot className="h-7 w-7 text-accent" /> Model Context Protocol (MCP) Server
          </h1>
          <p className="text-sm text-muted mt-1 font-mono">
            Connect ChatGPT, Claude, Claude Code, and IDE agents directly to VANTA AI.
          </p>
        </div>

        <Button
          onClick={handleRunMockTests}
          disabled={isRunningTests}
          className="bg-accent text-accent-foreground font-bold text-xs h-11 px-6 rounded-xl cursor-pointer"
        >
          {isRunningTests ? (
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin" /> Running Tests...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="h-4 w-4 fill-current" /> Run MockMcpClient Tests
            </span>
          )}
        </Button>
      </div>

      {/* Endpoint & Server Status Banner */}
      <div className="p-6 rounded-3xl border border-border bg-surface/50 space-y-4 font-mono text-xs shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-accent font-bold uppercase tracking-wider flex items-center gap-2">
            <Cpu className="h-4 w-4" /> Remote MCP Endpoint (JSON-RPC 2.0 / SSE)
          </span>
          <Badge variant="outline" className="border-green-500 text-green-400">
            ONLINE & ACTIVE
          </Badge>
        </div>

        <div className="p-3 rounded-xl border border-border bg-background flex items-center justify-between gap-2">
          <code className="text-accent font-bold text-xs">{mcpServerUrl}</code>
          <Button size="sm" variant="ghost" onClick={copyUrl} className="h-8 w-8 p-0 text-accent">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Automated Test Suite Results */}
      {testResults && (
        <div className="p-6 rounded-2xl border border-border bg-surface/60 space-y-3 font-mono text-xs">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Terminal className="h-4 w-4 text-accent" /> MockMcpClient Automated Test Suite Results
          </h3>
          <div className="space-y-2">
            {testResults.map((r, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-border/80 bg-background flex items-center justify-between">
                <span className="text-foreground">{r.test}</span>
                <div className="flex items-center gap-2">
                  {r.details && <span className="text-[10px] text-muted">{r.details}</span>}
                  <Badge variant="outline" className={r.status === "PASSED" ? "border-green-500 text-green-400" : "border-destructive text-destructive"}>
                    {r.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Agents Table */}
      <div className="rounded-2xl border border-border bg-surface/50 overflow-hidden font-mono text-xs">
        <div className="p-4 border-b border-border font-bold text-foreground flex items-center justify-between bg-surface/40">
          <span>Connected AI Agents & Clients</span>
          <span className="text-[11px] text-muted">{connections.length} Connections</span>
        </div>

        {connections.length === 0 ? (
          <div className="p-10 text-center text-muted">
            No external agents connected yet. Run MockMcpClient tests above or authorize a client via OAuth.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {connections.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{c.clientName}</span>
                    <Badge variant="outline" className="border-accent text-accent">
                      {c.clientType}
                    </Badge>
                    <Badge variant="outline" className={c.status === "ACTIVE" ? "border-green-500 text-green-400" : "border-destructive text-destructive"}>
                      {c.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted block mt-1">Scopes: {c.scopes}</span>
                </div>

                {c.status === "ACTIVE" && (
                  <Button size="sm" variant="ghost" onClick={() => handleRevoke(c.id)} className="h-8 text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" /> Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
