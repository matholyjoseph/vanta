import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeyService } from "@/lib/api/api-key-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  const auth = await apiKeyService.authenticateBearerToken(req.headers.get("authorization"));

  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json(
      { error: { type: "authentication_error", code: "unauthorized", message: auth.error } },
      { status: 401 }
    );
  }

  const generation = await db.generation.findFirst({
    where: { id: resolvedParams.id, userId: auth.userId },
  });

  if (!generation) {
    return NextResponse.json(
      { error: { type: "invalid_request_error", code: "not_found", message: "Generation record not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: generation.id,
    object: "generation",
    media_type: generation.mediaType,
    mode: generation.mode,
    status: generation.status.toLowerCase(),
    prompt: generation.prompt,
    credits_used: generation.creditCost,
    output_url: generation.videoUrl || generation.imageUrl || generation.audioUrl,
    error: generation.errorMessage,
    created_at: generation.createdAt.toISOString(),
    completed_at: generation.completedAt?.toISOString() || null,
  });
}
