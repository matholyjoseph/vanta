import * as React from "react";
import type { Metadata } from "next";
import { getConnectedMcpAgentsAction, getMcpSessionLogsAction } from "@/app/actions/mcp-actions";
import { McpDashboardClient } from "@/components/developers/mcp-dashboard-client";
import { ToastProvider } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MCP & AI Agent Integration — Developer Portal",
  description: "Connect external AI agents (ChatGPT, Claude, IDE Agents) via Model Context Protocol.",
};

export default async function DevelopersMcpPage() {
  const connections = await getConnectedMcpAgentsAction();
  const sessionLogs = await getMcpSessionLogsAction();

  return (
    <ToastProvider>
      <McpDashboardClient initialConnections={connections} initialSessionLogs={sessionLogs} />
    </ToastProvider>
  );
}
