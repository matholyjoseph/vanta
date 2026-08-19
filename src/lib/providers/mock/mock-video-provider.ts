import { db } from "@/lib/db";
import { getActorContext } from "@/lib/guest-auth";

export class MockVideoProvider {
  /**
   * Generates a mock video asset and creates DB Generation & Asset records.
   */
  public async generateVideo(data: {
    prompt: string;
    aspectRatio?: string;
    duration?: string;
    sourceImageUrl?: string;
    modelId?: string;
  }) {
    const actor = await getActorContext();
    const creditCost = 15;

    if (actor.testCredits < creditCost) {
      throw new Error(`Insufficient credits. Required: ${creditCost}, Available: ${actor.testCredits}`);
    }

    // Deduct credits
    if (actor.type === "GUEST" && actor.guestSessionId) {
      await db.guestSession.update({
        where: { id: actor.guestSessionId },
        data: { testCreditBalance: { decrement: creditCost } },
      });
    } else if (actor.userId) {
      await db.creditWallet.update({
        where: { userId: actor.userId },
        data: { balance: { decrement: creditCost } },
      });
    }

    const model = data.modelId
      ? await db.aIModel.findUnique({ where: { id: data.modelId } })
      : await db.aIModel.findFirst({ where: { type: "VIDEO" } });

    const modelId = model?.id || "vanta-test-video-model";

    // Playable MP4 video fixture URL
    const videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    const thumbnailUrl = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80";

    // Create DB Generation record
    const generation = await db.generation.create({
      data: {
        userId: actor.type === "USER" ? actor.userId : null,
        guestSessionId: actor.type === "GUEST" ? actor.guestSessionId : null,
        modelId,
        mediaType: "VIDEO",
        mode: data.sourceImageUrl ? "image-to-video" : "text-to-video",
        prompt: data.prompt,
        status: "COMPLETED",
        progress: 100,
        duration: data.duration || "5s",
        aspectRatio: data.aspectRatio || "16:9",
        creditCost,
        videoUrl,
        imageUrl: data.sourceImageUrl || null,
        thumbnailUrl,
        completedAt: new Date(),
      },
    });

    // Create DB Asset record
    const asset = await db.asset.create({
      data: {
        userId: actor.type === "USER" ? actor.userId : null,
        guestSessionId: actor.type === "GUEST" ? actor.guestSessionId : null,
        type: "VIDEO",
        name: `Generated Video — ${data.prompt.substring(0, 24)}...`,
        url: videoUrl,
        thumbnailUrl,
        duration: data.duration || "00:05",
        mimeType: "video/mp4",
        generationId: generation.id,
      },
    });

    return { generation, asset };
  }
}

export const mockVideoProvider = new MockVideoProvider();
