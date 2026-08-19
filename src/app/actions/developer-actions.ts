"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { apiKeyService } from "@/lib/api/api-key-service";
import { webhookDispatcher } from "@/lib/api/webhook-dispatcher";

export async function createApiKeyAction(params: {
  name: string;
  environment?: "LIVE" | "TEST";
  permissions?: any[];
}) {
  const user = await getAuthenticatedOrGuestUser();
  const res = await apiKeyService.createApiKey({
    userId: user.id,
    name: params.name,
    environment: params.environment || "LIVE",
    permissions: params.permissions,
  });

  revalidatePath("/developers/api-keys");
  return res; // Contains apiKey object & plaintextKey (shown ONCE)
}

export async function getApiKeysAction() {
  const user = await getAuthenticatedOrGuestUser();
  return db.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeApiKeyAction(keyId: string) {
  const user = await getAuthenticatedOrGuestUser();
  const updated = await apiKeyService.revokeApiKey(user.id, keyId);
  revalidatePath("/developers/api-keys");
  return updated;
}

export async function rotateApiKeyAction(keyId: string) {
  const user = await getAuthenticatedOrGuestUser();
  const oldKey = await db.apiKey.findFirst({ where: { id: keyId, userId: user.id } });
  if (!oldKey) throw new Error("API key not found.");

  // Create new key
  const newKeyRes = await apiKeyService.createApiKey({
    userId: user.id,
    name: `${oldKey.name} (Rotated)`,
    environment: oldKey.environment as any,
  });

  // Revoke old key
  await apiKeyService.revokeApiKey(user.id, oldKey.id);

  revalidatePath("/developers/api-keys");
  return newKeyRes;
}

export async function createWebhookEndpointAction(params: {
  url: string;
  description?: string;
  events: string[];
}) {
  const user = await getAuthenticatedOrGuestUser();

  const rawSecret = `whsec_${crypto.randomBytes(20).toString("hex")}`;

  const endpoint = await db.developerWebhookEndpoint.create({
    data: {
      userId: user.id,
      url: params.url,
      description: params.description,
      status: "ACTIVE",
      secretHash: rawSecret, // Full secret returned once
      events: params.events.join(","),
    },
  });

  revalidatePath("/developers/webhooks");
  return { endpoint, signingSecret: rawSecret };
}

export async function getWebhookEndpointsAction() {
  const user = await getAuthenticatedOrGuestUser();
  return db.developerWebhookEndpoint.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      deliveries: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function sendTestWebhookEventAction(endpointId: string) {
  const res = await webhookDispatcher.sendTestEvent(endpointId);
  revalidatePath("/developers/webhooks");
  return res;
}

export async function getApiRequestLogsAction() {
  const user = await getAuthenticatedOrGuestUser();
  return db.apiRequestLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { apiKey: true },
  });
}

export async function getDeveloperOverviewMetricsAction() {
  const user = await getAuthenticatedOrGuestUser();

  const totalKeys = await db.apiKey.count({ where: { userId: user.id, status: "ACTIVE" } });
  const totalLogs = await db.apiRequestLog.count({ where: { userId: user.id } });
  const failedLogs = await db.apiRequestLog.count({ where: { userId: user.id, statusCode: { gte: 400 } } });

  const webhooks = await db.developerWebhookEndpoint.findMany({ where: { userId: user.id } });

  return {
    activeKeys: totalKeys,
    totalRequestsToday: totalLogs,
    successfulRequests: Math.max(0, totalLogs - failedLogs),
    failedRequests: failedLogs,
    webhooksCount: webhooks.length,
    webhookHealth: webhooks.every((w) => w.status === "ACTIVE") ? "HEALTHY" : "DEGRADED",
  };
}
