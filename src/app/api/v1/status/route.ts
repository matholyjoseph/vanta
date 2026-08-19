import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "operational",
    version: "v1",
    timestamp: new Date().toISOString(),
    services: {
      api_gateway: "online",
      generation_queue: "online",
      storage_engine: "online",
      director_agent: "online",
    },
  });
}
