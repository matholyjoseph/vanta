import crypto from "crypto";
import { db } from "@/lib/db";
import { ApiScope } from "@/lib/api/api-types";

export class ApiKeyService {
  /**
   * Generates a new cryptographically secure API key.
   * Returns plaintext secret ONLY ONCE.
   */
  public async createApiKey(params: {
    userId: string;
    name: string;
    environment?: "LIVE" | "TEST";
    permissions?: ApiScope[];
    rateLimitTier?: "STANDARD" | "PRO" | "ENTERPRISE";
    expiresInDays?: number;
  }) {
    const environment = params.environment || "LIVE";
    const prefixStr = environment === "LIVE" ? "vanta_live_" : "vanta_test_";

    const randomBytes = crypto.randomBytes(24).toString("hex");
    const plaintextKey = `${prefixStr}${randomBytes}`;

    const prefix = plaintextKey.substring(0, 16);
    const lastFour = plaintextKey.substring(plaintextKey.length - 4);
    const secretHash = crypto.createHash("sha256").update(plaintextKey).digest("hex");

    const scopes = params.permissions || [
      "models:read",
      "generations:read",
      "generations:create",
      "assets:read",
    ];

    const expiresAt = params.expiresInDays
      ? new Date(Date.now() + params.expiresInDays * 86400000)
      : null;

    const apiKey = await db.apiKey.create({
      data: {
        userId: params.userId,
        name: params.name,
        prefix,
        secretHash,
        lastFour,
        status: "ACTIVE",
        permissions: scopes.join(","),
        environment,
        rateLimitTier: params.rateLimitTier || "STANDARD",
        expiresAt,
      },
    });

    return {
      apiKey,
      plaintextKey, // Return plaintext secret ONLY ONCE to client
    };
  }

  /**
   * Authenticates Bearer token from incoming API request.
   */
  public async authenticateBearerToken(authHeader: string | null) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { authenticated: false, error: "Missing or malformed Authorization header. Expected Bearer token." };
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token.startsWith("vanta_live_") && !token.startsWith("vanta_test_")) {
      return { authenticated: false, error: "Invalid API key format." };
    }

    const secretHash = crypto.createHash("sha256").update(token).digest("hex");

    const apiKey = await db.apiKey.findFirst({
      where: { secretHash },
    });

    if (!apiKey) {
      return { authenticated: false, error: "Invalid or unknown API key." };
    }

    if (apiKey.status !== "ACTIVE") {
      return { authenticated: false, error: `API key is ${apiKey.status.toLowerCase()}.` };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { authenticated: false, error: "API key has expired." };
    }

    // Touch lastUsedAt asynchronously
    db.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    const scopes = apiKey.permissions.split(",") as ApiScope[];

    return {
      authenticated: true,
      apiKey,
      userId: apiKey.userId,
      environment: apiKey.environment,
      scopes,
    };
  }

  /**
   * Verifies required scope permissions.
   */
  public hasScope(scopes: ApiScope[], requiredScope: ApiScope): boolean {
    return scopes.includes(requiredScope);
  }

  /**
   * Revokes an API Key.
   */
  public async revokeApiKey(userId: string, keyId: string) {
    const key = await db.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new Error("API key not found.");

    return db.apiKey.update({
      where: { id: keyId },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
  }
}

export const apiKeyService = new ApiKeyService();
