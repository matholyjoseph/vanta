import { NextRequest, NextResponse } from "next/server";
import { mcpServer } from "@/lib/mcp/mcp-server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const jsonRpcRequest = await req.json();

    const response = await mcpServer.handleJsonRpcRequest(jsonRpcRequest, authHeader);
    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error", data: err?.message },
      },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    name: "VANTA AI Remote MCP Endpoint",
    version: "1.0.0",
    protocol: "JSON-RPC 2.0 / MCP 2024-11-05",
    status: "operational",
    endpoint: "/api/mcp",
  });
}
