import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { refundCredits } from "@/lib/video/pricing";
import { emitGenerationProgress } from "@/lib/events/hub";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const generation = await db.generation.findUnique({
      where: { id },
    });

    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    if (generation.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (generation.status === "COMPLETED" || generation.status === "FAILED") {
      return NextResponse.json(
        { error: `Cannot cancel a ${generation.status.toLowerCase()} generation.` },
        { status: 400 }
      );
    }

    // Set to CANCELLED
    await db.generation.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Refund reserved credits
    await refundCredits({
      userId: generation.userId,
      amount: generation.creditCost,
      generationId: generation.id,
      reason: "User cancelled generation",
    });

    emitGenerationProgress(id, { status: "CANCELLED", progress: 0 });

    return NextResponse.json({ success: true, status: "CANCELLED" });
  } catch {
    return NextResponse.json({ error: "Failed to cancel generation" }, { status: 500 });
  }
}
