import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";
import { refundCredits } from "@/lib/video/pricing";
import { emitGenerationProgress } from "@/lib/events/hub";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // fal.ai webhook payload schema
    const requestId = body.request_id || body.requestId;
    const status = body.status;
    const error = body.error;
    const payloadObj = body.payload || body.output || body;

    if (!requestId) {
      return NextResponse.json({ error: "Missing request_id in webhook body" }, { status: 400 });
    }

    // Find generation record in DB by providerJobId suffix or exact match
    const generation = await db.generation.findFirst({
      where: {
        OR: [
          { providerJobId: requestId },
          { providerJobId: { endsWith: `::${requestId}` } },
        ],
      },
      include: { model: true },
    });

    if (!generation) {
      return NextResponse.json({ message: "Generation not found, ignoring webhook" }, { status: 200 });
    }

    // Idempotency check: Ignore if already finished
    if (
      generation.status === "COMPLETED" ||
      generation.status === "FAILED" ||
      generation.status === "CANCELLED"
    ) {
      return NextResponse.json({ message: "Generation already finalized" }, { status: 200 });
    }

    // Handle Failure / Moderation Rejection
    if (status === "ERROR" || status === "FAILED" || error) {
      const errorMsg = typeof error === "string" ? error : error?.message || "Generation failed on provider engine";

      await db.generation.update({
        where: { id: generation.id },
        data: {
          status: "FAILED",
          errorMessage: errorMsg,
          completedAt: new Date(),
        },
      });

      await refundCredits({
        userId: generation.userId || generation.guestSessionId || "guest-user",
        amount: generation.creditCost,
        generationId: generation.id,
        reason: errorMsg,
      });

      emitGenerationProgress(generation.id, {
        status: "FAILED",
        progress: 0,
        error: errorMsg,
      });

      return NextResponse.json({ success: true, status: "FAILED" });
    }

    // Handle Success / Completion
    if (status === "OK" || status === "COMPLETED") {
      const videoObj = payloadObj.video || payloadObj.videos?.[0] || payloadObj.output;
      const rawVideoUrl = typeof videoObj === "string" ? videoObj : videoObj?.url;

      if (!rawVideoUrl) {
        return NextResponse.json({ error: "No video URL found in completion payload" }, { status: 400 });
      }

      // Download provider video & upload to persistent VANTA storage (PART 11)
      let finalVideoUrl = rawVideoUrl;
      let finalThumbnailUrl = payloadObj.thumbnail_url || payloadObj.preview_url || "/werewolf_cinematic_preview.jpg";

      try {
        const videoRes = await fetch(rawVideoUrl);
        if (videoRes.ok) {
          const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
          const storageKey = `users/${generation.userId}/generations/${generation.id}/output.mp4`;
          const storage = getStorageProvider();
          const uploaded = await storage.upload(videoBuffer, storageKey, "video/mp4");
          finalVideoUrl = uploaded.url;
        }
      } catch (err) {
        console.warn("[Webhook] Storage upload failed, keeping provider output URL:", err);
      }

      // Update Generation record
      const updatedGen = await db.generation.update({
        where: { id: generation.id },
        data: {
          status: "COMPLETED",
          progress: 100,
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalThumbnailUrl,
          completedAt: new Date(),
        },
      });

      // Create Asset record in asset library (PART 11 & 25)
      await db.asset.create({
        data: {
          userId: generation.userId,
          name: `${generation.model?.name || "Vanta AI"} - ${generation.prompt.slice(0, 20)}...`,
          type: "VIDEO",
          url: finalVideoUrl,
          thumbnailUrl: finalThumbnailUrl,
          resolution: generation.resolution,
          duration: generation.duration,
          generationId: generation.id,
          mimeType: "video/mp4",
        },
      });

      emitGenerationProgress(generation.id, {
        status: "COMPLETED",
        progress: 100,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
      });

      return NextResponse.json({ success: true, generation: updatedGen });
    }

    return NextResponse.json({ message: "Webhook acknowledged" }, { status: 200 });
  } catch (error) {
    console.error("Fal webhook error:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
