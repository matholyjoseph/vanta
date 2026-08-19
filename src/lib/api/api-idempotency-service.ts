import crypto from "crypto";
import { db } from "@/lib/db";

export class ApiIdempotencyService {
  /**
   * Checks if an idempotency key was previously processed.
   * If yes, returns cached response.
   */
  public async getCachedIdempotentResponse(userId: string, idempotencyKey: string, requestBody: any) {
    if (!idempotencyKey) return null;

    const requestHash = crypto.createHash("sha256").update(JSON.stringify(requestBody)).digest("hex");

    const record = await db.apiIdempotencyKey.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });

    if (!record) return null;

    // Verify request body matching
    if (record.requestHash !== requestHash) {
      return {
        isConflict: true,
        error: {
          type: "invalid_request_error",
          code: "idempotency_key_reused_with_different_body",
          message: "The Idempotency-Key was previously used with a different request payload.",
        },
      };
    }

    return {
      isConflict: false,
      responseStatus: record.responseStatus,
      responseBody: JSON.parse(record.responseBody),
    };
  }

  /**
   * Saves idempotent response for future retries.
   */
  public async saveIdempotentResponse(
    userId: string,
    apiKeyId: string | undefined,
    idempotencyKey: string,
    requestBody: any,
    responseStatus: number,
    responseBody: any
  ) {
    if (!idempotencyKey) return;

    const requestHash = crypto.createHash("sha256").update(JSON.stringify(requestBody)).digest("hex");
    const expiresAt = new Date(Date.now() + 86400000 * 7); // 7 days retention

    await db.apiIdempotencyKey.upsert({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      create: {
        userId,
        apiKeyId,
        idempotencyKey,
        requestHash,
        responseStatus,
        responseBody: JSON.stringify(responseBody),
        expiresAt,
      },
      update: {
        responseStatus,
        responseBody: JSON.stringify(responseBody),
      },
    }).catch(() => {});
  }
}

export const apiIdempotencyService = new ApiIdempotencyService();
