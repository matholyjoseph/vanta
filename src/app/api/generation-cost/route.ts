import { NextResponse } from "next/server";
import { calculateGenerationCost } from "@/lib/video/pricing";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const modelId = searchParams.get("modelId") || "vanta-motion-fast";
  const duration = searchParams.get("duration") || "5s";
  const resolution = searchParams.get("resolution") || "1080p";
  const audio = searchParams.get("audio") === "true";
  const outputCount = parseInt(searchParams.get("outputCount") || "1", 10);

  const creditCost = await calculateGenerationCost({
    modelId,
    duration,
    resolution,
    audio,
    outputCount,
  });

  return NextResponse.json({ creditCost });
}
