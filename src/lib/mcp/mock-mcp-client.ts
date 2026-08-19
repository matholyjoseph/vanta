import { mcpServer } from "@/lib/mcp/mcp-server";

export class MockMcpClientRunner {
  public async runTestSuite() {
    const results: Array<{ test: string; status: "PASSED" | "FAILED"; details?: string }> = [];

    // Test 1: Initialize
    try {
      const initRes: any = await mcpServer.handleJsonRpcRequest(
        { jsonrpc: "2.0", id: 1, method: "initialize" },
        null
      );
      if (initRes?.result?.serverInfo?.name === "VANTA AI") {
        results.push({ test: "MCP Server Initialization", status: "PASSED" });
      } else {
        results.push({ test: "MCP Server Initialization", status: "FAILED", details: "Server info mismatch" });
      }
    } catch (e: any) {
      results.push({ test: "MCP Server Initialization", status: "FAILED", details: e?.message });
    }

    // Test 2: Tools Discovery
    try {
      const toolsRes: any = await mcpServer.handleJsonRpcRequest(
        { jsonrpc: "2.0", id: 2, method: "tools/list" },
        null
      );
      const tools = toolsRes?.result?.tools || [];
      if (tools.some((t: any) => t.name === "vanta_models_list")) {
        results.push({ test: "Tools Discovery (tools/list)", status: "PASSED", details: `Found ${tools.length} tools` });
      } else {
        results.push({ test: "Tools Discovery (tools/list)", status: "FAILED", details: "vanta_models_list missing" });
      }
    } catch (e: any) {
      results.push({ test: "Tools Discovery (tools/list)", status: "FAILED", details: e?.message });
    }

    // Test 3: Read-Only Tool Execution (vanta_models_list)
    try {
      const callRes: any = await mcpServer.handleJsonRpcRequest(
        { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "vanta_models_list", arguments: {} } },
        null
      );
      if (callRes?.result?.content?.[0]?.text) {
        results.push({ test: "Read-Only Tool Execution (vanta_models_list)", status: "PASSED" });
      } else {
        results.push({ test: "Read-Only Tool Execution (vanta_models_list)", status: "FAILED" });
      }
    } catch (e: any) {
      results.push({ test: "Read-Only Tool Execution (vanta_models_list)", status: "FAILED", details: e?.message });
    }

    // Test 4: Cost Confirmation Threshold Test (vanta_director_produce)
    try {
      // First plan a run
      const planRes: any = await mcpServer.handleJsonRpcRequest(
        { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "vanta_director_plan", arguments: { prompt: "Test Film" } } },
        null
      );
      const planData = JSON.parse(planRes?.result?.content?.[0]?.text || "{}");
      const runId = planData?.directorRunId;

      if (runId) {
        const produceRes: any = await mcpServer.handleJsonRpcRequest(
          { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "vanta_director_produce", arguments: { directorRunId: runId, confirmed: false } } },
          null
        );
        const produceData = JSON.parse(produceRes?.result?.content?.[0]?.text || "{}");
        if (produceData?.status === "confirmation_required") {
          results.push({ test: "Cost Confirmation Threshold Enforcement", status: "PASSED", details: "Server returned confirmation_required" });
        } else {
          results.push({ test: "Cost Confirmation Threshold Enforcement", status: "FAILED" });
        }
      }
    } catch (e: any) {
      results.push({ test: "Cost Confirmation Threshold Enforcement", status: "FAILED", details: e?.message });
    }

    // Test 5: Cost-Producing Tool Execution (vanta_video_generate)
    try {
      const genRes: any = await mcpServer.handleJsonRpcRequest(
        { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "vanta_video_generate", arguments: { prompt: "Test sports car" } } },
        null
      );
      const genData = JSON.parse(genRes?.result?.content?.[0]?.text || "{}");
      if (genData?.generationId) {
        results.push({ test: "Cost-Producing Tool (vanta_video_generate)", status: "PASSED", details: `Queued ID: ${genData.generationId}` });
      } else {
        results.push({ test: "Cost-Producing Tool (vanta_video_generate)", status: "FAILED" });
      }
    } catch (e: any) {
      results.push({ test: "Cost-Producing Tool (vanta_video_generate)", status: "FAILED", details: e?.message });
    }

    return results;
  }
}

export const mockMcpClientRunner = new MockMcpClientRunner();
