import { z } from "zod";

export const MCP_SCOPES = [
  "models:read",
  "credits:read",
  "generations:read",
  "generations:create",
  "generations:cancel",
  "assets:read",
  "projects:read",
  "projects:write",
  "director:read",
  "director:create",
  "director:produce",
  "director:approve",
  "shorts:read",
  "shorts:create",
  "exports:read",
  "exports:create",
] as const;

export type McpScope = typeof MCP_SCOPES[number];

export type ToolSafetyClassification = "READ_ONLY" | "WRITE" | "COST_PRODUCING" | "DESTRUCTIVE";

export interface McpToolDefinition {
  name: string;
  title: string;
  description: string;
  safety: ToolSafetyClassification;
  requiredScope: McpScope;
  inputSchema: any; // Zod schema
  handler: (params: any, context: McpAuthContext) => Promise<any>;
}

export interface McpAuthContext {
  connectionId: string;
  userId: string;
  clientType: string;
  clientName: string;
  scopes: McpScope[];
  environment: "LIVE" | "TEST";
}

export const jsonRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.any().optional(),
});

export type JsonRpcRequest = z.infer<typeof jsonRpcRequestSchema>;
