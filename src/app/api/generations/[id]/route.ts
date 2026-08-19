import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedOrGuestUser();
    const { id } = await params;

    const generation = await db.generation.findUnique({
      where: { id },
      include: { model: true, user: { select: { id: true, email: true } } },
    });

    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    // Security check: verify user owns this generation
    if (generation.userId && generation.userId !== user.id && generation.user?.email !== user.email) {
      return NextResponse.json({ error: "Forbidden: You do not own this generation" }, { status: 403 });
    }

    return NextResponse.json({ generation });
  } catch {
    return NextResponse.json({ error: "Failed to fetch generation" }, { status: 500 });
  }
}
