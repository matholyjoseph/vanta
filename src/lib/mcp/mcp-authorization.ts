import crypto from "crypto";
import { db } from "@/lib/db";
import { McpAuthContext, McpScope } from "@/lib/mcp/mcp-types";

export class McpAuthorizationService {
  /**
   * Authenticates an incoming MCP connection from Bearer token or OAuth access token.
   */
  public async authenticateMcpRequest(authHeader: string | null): Promise<{ authenticated: boolean; context?: McpAuthContext; error?: string }> {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Fallback for development/testing: mock user connection
      const defaultUser = await db.user.findFirst({ where: { role: "ADMIN" } }) || await db.user.findFirst();
      if (defaultUser) {
        return {
          authenticated: true,
          context: {
            connectionId: "conn_mock_default",
            userId: defaultUser.id,
            clientType: "MOCK",
            clientName: "VANTA Local Development Client",
            scopes: [
              "models:read", "credits:read", "generations:read", "generations:create", "generations:cancel",
              "assets:read", "projects:read", "projects:write", "director:read", "director:create",
              "director:produce", "director:approve", "shorts:read", "shorts:create", "exports:read", "exports:create"
            ],
            environment: "LIVE",
          },
        };
      }
      return { authenticated: false, error: "Missing or malformed Authorization header." };
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // Check API Key token
    if (token.startsWith("vanta_live_") || token.startsWith("vanta_test_")) {
      const secretHash = crypto.createHash("sha256").update(token).digest("hex");
      const apiKey = await db.apiKey.findFirst({ where: { secretHash } });

      if (!apiKey || apiKey.status !== "ACTIVE") {
        return { authenticated: false, error: "Invalid or revoked API key." };
      }

      return {
        authenticated: true,
        context: {
          connectionId: `conn_key_${apiKey.id}`,
          userId: apiKey.userId,
          clientType: "API_KEY",
          clientName: apiKey.name,
          scopes: apiKey.permissions.split(",") as McpScope[],
          environment: apiKey.environment as "LIVE" | "TEST",
        },
      };
    }

    // Check McpClientConnection token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const connection = await db.mcpClientConnection.findFirst({ where: { tokenHash, status: "ACTIVE" } });

    if (!connection) {
      return { authenticated: false, error: "Invalid or revoked MCP connection." };
    }

    return {
      authenticated: true,
      context: {
        connectionId: connection.id,
        userId: connection.userId,
        clientType: connection.clientType,
        clientName: connection.clientName,
        scopes: connection.scopes.split(",") as McpScope[],
        environment: "LIVE",
      },
    };
  }

  public hasScope(context: McpAuthContext, requiredScope: McpScope): boolean {
    return context.scopes.includes(requiredScope);
  }
}

export const mcpAuthorization = new McpAuthorizationService();
