import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProvider } from "@/lib/video/providers";
import { refundCredits } from "@/lib/video/pricing";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const generation = await db.generation.findUnique({
      where: { id },
      include: { model: { include: { provider: true } } },
    });

    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    // Verify ownership
    if (session?.user?.id && generation.userId !== session.user.id) {
      const user = await db.user.findUnique({ where: { email: session.user.email! } });
      if (!user || user.id !== generation.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // If already completed, failed, or cancelled, return immediately
    if (
      generation.status === "COMPLETED" ||
      generation.status === "FAILED" ||
      generation.status === "CANCELLED"
    ) {
      return NextResponse.json({ generation });
    }

    // Poll provider status
    if (generation.providerJobId) {
      const providerSlug = generation.model?.provider?.slug || "vanta-mock";
      const provider = getProvider(providerSlug);
      const statusResult = await provider.getGenerationStatus(generation.providerJobId);

      const isNewlyCompleted =
        statusResult.status === "COMPLETED" && generation.status !== "COMPLETED";

      const updated = await db.generation.update({
        where: { id },
        data: {
          status: statusResult.status,
          progress: statusResult.progress,
          videoUrl: statusResult.videoUrl || generation.videoUrl,
          thumbnailUrl: statusResult.thumbnailUrl || generation.thumbnailUrl,
          errorMessage: statusResult.errorMessage || null,
        },
      });

      // Automatically create an Asset record when completed (PART 16)
      if (isNewlyCompleted) {
        await db.asset.create({
          data: {
            userId: generation.userId,
            name: `${generation.model?.name || "Vanta AI"} - ${generation.prompt.slice(0, 20)}...`,
            type: "VIDEO",
            url: statusResult.videoUrl || "/werewolf_cinematic_preview.jpg",
            thumbnailUrl: statusResult.thumbnailUrl || "/werewolf_cinematic_preview.jpg",
            resolution: generation.resolution,
            duration: generation.duration,
            generationId: generation.id,
            mimeType: "video/mp4",
          },
        });
      }

      // If failed, refund credits
      if (statusResult.status === "FAILED" && generation.status !== "FAILED") {
        await refundCredits({
          userId: generation.userId || generation.guestSessionId || "guest-user",
          amount: generation.creditCost,
          generationId: generation.id,
          reason: statusResult.errorMessage || "Generation failed on provider engine",
        });
      }

      return NextResponse.json({ generation: updated });
    }

    return NextResponse.json({ generation });
  } catch (error) {
    console.error("Status polling error:", error);
    return NextResponse.json({ error: "Failed to poll status" }, { status: 500 });
  }
}
