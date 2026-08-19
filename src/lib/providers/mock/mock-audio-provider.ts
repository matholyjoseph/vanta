import { db } from "@/lib/db";
import { getActorContext } from "@/lib/guest-auth";

export class MockAudioProvider {
  public async generateAudio(data: {
    prompt: string;
    voiceId?: string;
    modelId?: string;
  }) {
    const actor = await getActorContext();
    const creditCost = 5;

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
      : await db.aIModel.findFirst({ where: { type: "AUDIO" } });

    const modelId = model?.id || "vanta-test-audio-model";
    const audioUrl = "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg";

    const generation = await db.generation.create({
      data: {
        userId: actor.type === "USER" ? actor.userId : null,
        guestSessionId: actor.type === "GUEST" ? actor.guestSessionId : null,
        modelId,
        mediaType: "AUDIO",
        mode: "text-to-speech",
        prompt: data.prompt,
        status: "COMPLETED",
        progress: 100,
        creditCost,
        audioUrl,
        voiceId: data.voiceId || "en-US-Standard-A",
        completedAt: new Date(),
      },
    });

    const asset = await db.asset.create({
      data: {
        userId: actor.type === "USER" ? actor.userId : null,
        guestSessionId: actor.type === "GUEST" ? actor.guestSessionId : null,
        type: "AUDIO",
        name: `Generated Audio — ${data.prompt.substring(0, 24)}...`,
        url: audioUrl,
        mimeType: "audio/ogg",
        duration: "00:08",
        generationId: generation.id,
      },
    });

    return { generation, asset };
  }
}

export const mockAudioProvider = new MockAudioProvider();
