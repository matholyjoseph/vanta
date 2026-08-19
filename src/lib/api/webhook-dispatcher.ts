import crypto from "crypto";
import { db } from "@/lib/db";

export interface WebhookEventPayload {
  id: string;
  type: string;
  created_at: string;
  data: {
    object: any;
  };
}

export class WebhookDispatcherService {
  /**
   * Triggers outbound webhook delivery to developer endpoints registered for eventType.
   */
  public async dispatchEvent(userId: string, eventType: string, dataObject: any) {
    const endpoints = await db.developerWebhookEndpoint.findMany({
      where: {
        userId,
        status: { in: ["ACTIVE", "DEGRADED"] },
      },
    });

    const targetEndpoints = endpoints.filter(
      (ep) => ep.events.includes("*") || ep.events.includes(eventType)
    );

    if (targetEndpoints.length === 0) return;

    const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const payload: WebhookEventPayload = {
      id: eventId,
      type: eventType,
      created_at: new Date().toISOString(),
      data: { object: dataObject },
    };

    for (const ep of targetEndpoints) {
      await this.deliverPayload(ep, payload);
    }
  }

  /**
   * Sends a test webhook event to a specific endpoint.
   */
  public async sendTestEvent(endpointId: string) {
    const ep = await db.developerWebhookEndpoint.findUnique({ where: { id: endpointId } });
    if (!ep) throw new Error("Webhook endpoint not found.");

    const testPayload: WebhookEventPayload = {
      id: `evt_test_${Date.now()}`,
      type: "webhook.test",
      created_at: new Date().toISOString(),
      data: {
        object: {
          message: "This is a test webhook payload from VANTA AI Platform.",
          timestamp: new Date().toISOString(),
        },
      },
    };

    return this.deliverPayload(ep, testPayload);
  }

  private async deliverPayload(endpoint: any, payload: WebhookEventPayload) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payloadStr = JSON.stringify(payload);

    // Compute HMAC-SHA256 signature
    const signature = crypto
      .createHmac("sha256", endpoint.secretHash)
      .update(`${timestamp}.${payloadStr}`)
      .digest("hex");

    const deliveryRecord = await db.webhookDelivery.create({
      data: {
        eventId: payload.id,
        endpointId: endpoint.id,
        eventType: payload.type,
        payloadJson: payloadStr,
        status: "QUEUED",
        attempt: 1,
      },
    });

    const startTime = Date.now();
    try {
      // Direct HTTP POST to developer endpoint
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Vanta-Signature": signature,
          "X-Vanta-Timestamp": timestamp,
          "User-Agent": "VANTA-Webhook/1.0",
        },
        body: payloadStr,
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      const durationMs = Date.now() - startTime;
      const ok = response.ok;

      await db.webhookDelivery.update({
        where: { id: deliveryRecord.id },
        data: {
          status: ok ? "DELIVERED" : "FAILED",
          responseCode: response.status,
          durationMs,
          completedAt: new Date(),
        },
      });

      if (ok) {
        await db.developerWebhookEndpoint.update({
          where: { id: endpoint.id },
          data: { lastSuccessAt: new Date(), failureCount: 0 },
        });
      } else {
        await this.handleFailure(endpoint, `HTTP ${response.status}`);
      }

      return { success: ok, statusCode: response.status, durationMs };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      await db.webhookDelivery.update({
        where: { id: deliveryRecord.id },
        data: {
          status: "FAILED",
          error: err?.message || "Delivery timeout",
          durationMs,
          completedAt: new Date(),
        },
      });

      await this.handleFailure(endpoint, err?.message || "Connection timeout");
      return { success: false, statusCode: 0, durationMs, error: err?.message };
    }
  }

  private async handleFailure(endpoint: any, errorMsg: string) {
    const newFailures = (endpoint.failureCount || 0) + 1;
    const newStatus = newFailures >= 10 ? "DISABLED" : newFailures >= 3 ? "DEGRADED" : endpoint.status;

    await db.developerWebhookEndpoint.update({
      where: { id: endpoint.id },
      data: {
        failureCount: newFailures,
        lastFailureAt: new Date(),
        status: newStatus,
      },
    });
  }
}

export const webhookDispatcher = new WebhookDispatcherService();
