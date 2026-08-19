"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { mockMcpClientRunner } from "@/lib/mcp/mock-mcp-client";

export async function getConnectedMcpAgentsAction() {
  const user = await getAuthenticatedOrGuestUser();
  return db.mcpClientConnection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      sessionLogs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export async function revokeMcpConnectionAction(connectionId: string) {
  const user = await getAuthenticatedOrGuestUser();
  const conn = await db.mcpClientConnection.findFirst({ where: { id: connectionId, userId: user.id } });
  if (!conn) throw new Error("Connection not found.");

  const updated = await db.mcpClientConnection.update({
    where: { id: connectionId },
    data: { status: "REVOKED", revokedAt: new Date() },
  });

  revalidatePath("/developers/mcp");
  return updated;
}

export async function runMockMcpTestSuiteAction() {
  const results = await mockMcpClientRunner.runTestSuite();
  revalidatePath("/developers/mcp");
  return results;
}

export async function getMcpSessionLogsAction() {
  const user = await getAuthenticatedOrGuestUser();
  return db.mcpSessionLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
