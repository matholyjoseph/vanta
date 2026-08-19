import { NextRequest, NextResponse } from "next/server";
import { apiKeyService } from "@/lib/api/api-key-service";

export async function GET(req: NextRequest) {
  const auth = await apiKeyService.authenticateBearerToken(req.headers.get("authorization"));
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: { type: "authentication_error", code: "unauthorized", message: auth.error } },
      { status: 401 }
    );
  }

  const models = [
    {
      id: "vanta-cinema-pro",
      object: "model",
      name: "VANTA Cinema Pro",
      type: "VIDEO",
      description: "Highest quality cinematic video generation with temporal consistency and realistic motion.",
      supported_modes: ["text-to-video", "image-to-video"],
      supported_resolutions: ["720p", "1080p", "4k"],
      supported_durations: [5, 10],
      supported_aspect_ratios: ["16:9", "9:16", "1:1"],
      credit_cost_per_second: 4,
      status: "online",
    },
    {
      id: "vanta-nova-video",
      object: "model",
      name: "VANTA Nova Video",
      type: "VIDEO",
      description: "Ultra-fast hyperrealistic video generation for short-form content.",
      supported_modes: ["text-to-video", "image-to-video"],
      supported_resolutions: ["720p", "1080p"],
      supported_durations: [5, 8],
      supported_aspect_ratios: ["16:9", "9:16", "1:1"],
      credit_cost_per_second: 3,
      status: "online",
    },
    {
      id: "vanta-image-studio",
      object: "model",
      name: "VANTA Image Studio Ultra",
      type: "IMAGE",
      description: "Photorealistic 4K image generation with prompt precision.",
      supported_modes: ["text-to-image"],
      supported_resolutions: ["1024x1024", "1920x1080", "1080x1920"],
      credit_cost_per_second: 2,
      status: "online",
    },
  ];

  return NextResponse.json({ object: "list", data: models });
}
