"use server";

import { revalidatePath } from "next/cache";
import { getActorContext } from "@/lib/guest-auth";
import { mockImageProvider } from "@/lib/providers/mock/mock-image-provider";
import { mockVideoProvider } from "@/lib/providers/mock/mock-video-provider";
import { mockAudioProvider } from "@/lib/providers/mock/mock-audio-provider";
import { mockAvatarProvider } from "@/lib/providers/mock/mock-avatar-provider";

export async function generateTestImageAction(data: { prompt: string; aspectRatio?: string; modelId?: string }) {
  const result = await mockImageProvider.generateImage(data);
  revalidatePath("/studio/image");
  revalidatePath("/assets");
  return result;
}

export async function generateTestVideoAction(data: { prompt: string; aspectRatio?: string; duration?: string; sourceImageUrl?: string; modelId?: string }) {
  const result = await mockVideoProvider.generateVideo(data);
  revalidatePath("/studio/video");
  revalidatePath("/assets");
  return result;
}

export async function generateTestAudioAction(data: { prompt: string; voiceId?: string; modelId?: string }) {
  const result = await mockAudioProvider.generateAudio(data);
  revalidatePath("/studio/audio");
  revalidatePath("/assets");
  return result;
}

export async function generateTestAvatarAction(data: { prompt?: string; sourceImageAssetId?: string; audioAssetId?: string; modelId?: string }) {
  const result = await mockAvatarProvider.generateAvatar(data);
  revalidatePath("/studio/avatar");
  revalidatePath("/assets");
  return result;
}

export async function getActorContextAction() {
  return getActorContext();
}
