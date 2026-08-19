import { db } from "@/lib/db";
import { getActorContext } from "@/lib/guest-auth";

export class MockImageProvider {
  /**
   * Generates a mock image asset and stores real Generation & Asset records in DB.
   */
  public async generateImage(data: {
    prompt: string;
    aspectRatio?: string;
    modelId?: string;
  }) {
    const actor = await getActorContext();
    const creditCost = 5;

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

    // Find default model if not supplied
    const model = data.modelId
      ? await db.aIModel.findUnique({ where: { id: data.modelId } })
      : await db.aIModel.findFirst({ where: { type: "IMAGE" } });

    const modelId = model?.id || "vanta-test-image-model";

    // High quality mock SVG image placeholder fixture matching prompt/aspect ratio
    const width = data.aspectRatio === "9:16" ? 1080 : data.aspectRatio === "1:1" ? 1080 : 1920;
    const height = data.aspectRatio === "9:16" ? 1920 : data.aspectRatio === "1:1" ? 1080 : 1080;
    const imageUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=${width}&q=80`;

    // Create DB Generation record
    const generation = await db.generation.create({
      data: {
        userId: actor.type === "USER" ? actor.userId : null,
        guestSessionId: actor.type === "GUEST" ? actor.guestSessionId : null,
        modelId,
        mediaType: "IMAGE",
        mode: "text-to-image",
        prompt: data.prompt,
        status: "COMPLETED",
        progress: 100,
        aspectRatio: data.aspectRatio || "16:9",
        creditCost,
        imageUrl,
        thumbnailUrl: imageUrl,
        completedAt: new Date(),
      },
    });

    // Create DB Asset record
    const asset = await db.asset.create({
      data: {
        userId: actor.type === "USER" ? actor.userId : null,
        guestSessionId: actor.type === "GUEST" ? actor.guestSessionId : null,
        type: "IMAGE",
        name: `Generated Image — ${data.prompt.substring(0, 24)}...`,
        url: imageUrl,
        thumbnailUrl: imageUrl,
        width,
        height,
        mimeType: "image/jpeg",
        generationId: generation.id,
      },
    });

    return { generation, asset };
  }
}

export const mockImageProvider = new MockImageProvider();
