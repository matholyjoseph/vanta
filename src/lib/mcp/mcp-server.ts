import { db } from "@/lib/db";
import { mcpAuthorization } from "@/lib/mcp/mcp-authorization";
import { mcpToolRegistry } from "@/lib/mcp/mcp-tool-registry";
import { JsonRpcRequest, McpAuthContext } from "@/lib/mcp/mcp-types";

export class McpServerService {
  /**
   * Handles incoming JSON-RPC 2.0 MCP requests.
   */
  public async handleJsonRpcRequest(request: JsonRpcRequest, authHeader: string | null) {
    const startTime = Date.now();

    // 1. Authenticate Request
    const auth = await mcpAuthorization.authenticateMcpRequest(authHeader);
    if (!auth.authenticated || !auth.context) {
      return this.createJsonRpcError(request.id, -32001, "Authentication failed", auth.error);
    }

    const context = auth.context;

    // 2. Dispatch Methods
    switch (request.method) {
      case "initialize":
        return this.handleInitialize(request.id);

      case "tools/list":
        return this.handleToolsList(request.id, context);

      case "tools/call":
        return this.handleToolsCall(request.id, request.params, context, startTime);

      case "resources/list":
        return this.handleResourcesList(request.id);

      case "resources/read":
        return this.handleResourcesRead(request.id, request.params, context);

      case "prompts/list":
        return this.handlePromptsList(request.id);

      default:
        return this.createJsonRpcError(request.id, -32601, "Method not found", `Unsupported MCP method: ${request.method}`);
    }
  }

  private handleInitialize(id: string | number) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          prompts: { listChanged: false },
        },
        serverInfo: {
          name: "VANTA AI",
          version: "1.0.0",
          description: "AI media creation and filmmaking platform.",
        },
      },
    };
  }

  private handleToolsList(id: string | number, context: McpAuthContext) {
    const allTools = mcpToolRegistry.getAllTools();
    const authorizedTools = allTools.filter((t) => mcpAuthorization.hasScope(context, t.requiredScope));

    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: authorizedTools.map((t) => ({
          name: t.name,
          description: `[${t.safety}] ${t.description}`,
          inputSchema: {
            type: "object",
            properties: t.inputSchema._def?.shape ? Object.keys(t.inputSchema._def.shape()).reduce((acc: any, key) => {
              acc[key] = { type: "string" };
              return acc;
            }, {}) : {},
          },
        })),
      },
    };
  }

  private async handleToolsCall(id: string | number, params: any, context: McpAuthContext, startTime: number) {
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};

    const tool = mcpToolRegistry.getTool(toolName);
    if (!tool) {
      return this.createJsonRpcError(id, -32602, "Tool not found", `Tool '${toolName}' is not registered.`);
    }

    if (!mcpAuthorization.hasScope(context, tool.requiredScope)) {
      return this.createJsonRpcError(id, -32003, "Permission denied", `Connection lacks required scope '${tool.requiredScope}'.`);
    }

    try {
      const result = await tool.handler(toolArgs, context);
      const durationMs = Date.now() - startTime;

      // Log Session Activity
      db.mcpSessionLog.create({
        data: {
          connectionId: context.connectionId.startsWith("conn_mock") ? null : context.connectionId,
          userId: context.userId,
          toolName,
          status: result?.status === "confirmation_required" ? "CONFIRMATION_REQUIRED" : "SUCCESS",
          durationMs,
          creditsUsed: result?.estimatedCredits || 0,
          generationId: result?.generationId || null,
        },
      }).catch(() => {});

      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      db.mcpSessionLog.create({
        data: {
          connectionId: context.connectionId.startsWith("conn_mock") ? null : context.connectionId,
          userId: context.userId,
          toolName,
          status: "FAILED",
          durationMs,
          errorCode: err?.message || "Execution error",
        },
      }).catch(() => {});

      return this.createJsonRpcError(id, -32000, "Tool execution failed", err?.message || "Internal error during tool call.");
    }
  }

  private handleResourcesList(id: string | number) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        resources: [
          { uri: "vanta://models", name: "VANTA Models Registry", mimeType: "application/json" },
          { uri: "vanta://account/credits", name: "Account Credit Balance", mimeType: "application/json" },
        ],
      },
    };
  }

  private async handleResourcesRead(id: string | number, params: any, context: McpAuthContext) {
    const uri = params?.uri;
    if (uri === "vanta://models") {
      const tools = mcpToolRegistry.getTool("vanta_models_list");
      const models = await tools?.handler({}, context);
      return { jsonrpc: "2.0", id, result: { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(models) }] } };
    }

    if (uri === "vanta://account/credits") {
      const wallet = await db.creditWallet.findUnique({ where: { userId: context.userId } });
      return { jsonrpc: "2.0", id, result: { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ credits: wallet?.balance ?? 100 }) }] } };
    }

    return this.createJsonRpcError(id, -32602, "Resource not found", `Resource '${uri}' does not exist.`);
  }

  private handlePromptsList(id: string | number) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        prompts: [
          {
            name: "create-commercial",
            description: "Guide VANTA to plan and produce a luxury video commercial.",
            arguments: [{ name: "product", description: "Product name and core benefit", required: true }],
          },
        ],
      },
    };
  }

  private createJsonRpcError(id: string | number, code: number, message: string, data?: any) {
    return {
      jsonrpc: "2.0",
      id,
      error: { code, message, data },
    };
  }
}

export const mcpServer = new McpServerService();
