import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeyService } from "@/lib/api/api-key-service";

export async function GET(req: NextRequest) {
  const auth = await apiKeyService.authenticateBearerToken(req.headers.get("authorization"));
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json(
      { error: { type: "authentication_error", code: "unauthorized", message: auth.error } },
      { status: 401 }
    );
  }

  const assets = await db.asset.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    object: "list",
    data: assets.map((a) => ({
      id: a.id,
      object: "asset",
      name: a.name,
      type: a.type,
      url: a.url,
      mime_type: a.mimeType,
      duration: a.duration,
      resolution: a.resolution,
      created_at: a.createdAt.toISOString(),
    })),
  });
}
