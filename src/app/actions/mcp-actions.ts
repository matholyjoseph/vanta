"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { mockMcpClientRunner } from "@/lib/mcp/mock-mcp-client";

export async function getConnectedMcpAgentsAction() {
  try {
    const user = await getAuthenticatedOrGuestUser();
    return await db.mcpClientConnection.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        sessionLogs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
  } catch (err) {
    console.warn("[getConnectedMcpAgentsAction] DB read fallback:", err);
    return [];
  }
}

export async function revokeMcpConnectionAction(connectionId: string) {
  try {
    const user = await getAuthenticatedOrGuestUser();
    const conn = await db.mcpClientConnection.findFirst({ where: { id: connectionId, userId: user.id } });
    if (!conn) throw new Error("Connection not found.");

    const updated = await db.mcpClientConnection.update({
      where: { id: connectionId },
      data: { status: "REVOKED", revokedAt: new Date() },
    });

    revalidatePath("/developers/mcp");
    return updated;
  } catch (err) {
    console.warn("[revokeMcpConnectionAction] Warning:", err);
    return null;
  }
}

export async function runMockMcpTestSuiteAction() {
  const results = await mockMcpClientRunner.runTestSuite();
  revalidatePath("/developers/mcp");
  return results;
}

export async function getMcpSessionLogsAction() {
  try {
    const user = await getAuthenticatedOrGuestUser();
    return await db.mcpSessionLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch (err) {
    console.warn("[getMcpSessionLogsAction] DB read fallback:", err);
    return [];
  }
}
