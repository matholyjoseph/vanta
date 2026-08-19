import { db } from "@/lib/db";
import { getActorContext } from "@/lib/guest-auth";

export class MockAvatarProvider {
  public async generateAvatar(data: {
    prompt?: string;
    sourceImageAssetId?: string;
    audioAssetId?: string;
    modelId?: string;
  }) {
    const actor = await getActorContext();
    const creditCost = 20;

    if (actor.testCredits < creditCost) {
      throw new Error(`Insufficient credits. Required: ${creditCost}, Available: ${actor.testCredits}`);
    }

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

    const modelId = model?.id || "vanta-test-avatar-model";
    const videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    const thumbnailUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80";

    const generation = await db.generation.create({
      data: {
        userId: actor.type === "USER" ? actor.userId : null,
        guestSessionId: actor.type === "GUEST" ? actor.guestSessionId : null,
        modelId,
        mediaType: "VIDEO",
        mode: "talking-avatar",
        prompt: data.prompt || "Talking Avatar Video Generation",
        status: "COMPLETED",
        progress: 100,
        creditCost,
        videoUrl,
        thumbnailUrl,
        sourceImageAssetId: data.sourceImageAssetId || null,
        audioAssetId: data.audioAssetId || null,
        completedAt: new Date(),
      },
    });

    const asset = await db.asset.create({
      data: {
        userId: actor.type === "USER" ? actor.userId : null,
        guestSessionId: actor.type === "GUEST" ? actor.guestSessionId : null,
        type: "VIDEO",
        name: `Talking Avatar Video — ${new Date().toLocaleTimeString()}`,
        url: videoUrl,
        thumbnailUrl,
        duration: "00:05",
        mimeType: "video/mp4",
        generationId: generation.id,
      },
    });

    return { generation, asset };
  }
}

export const mockAvatarProvider = new MockAvatarProvider();
