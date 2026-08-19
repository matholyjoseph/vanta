import { NextResponse } from "next/server";
import { z } from "zod";
import { getStorageProvider } from "@/lib/storage";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

const presignSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().max(500 * 1024 * 1024, { message: "File size exceeds 500MB limit" }),
});

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedOrGuestUser();

    const body = await req.json();
    const validated = presignSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid upload request", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { filename, mimeType } = validated.data;
    const userId = user.id;
    const extension = filename.split(".").pop() || "bin";
    const key = `references/${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extension}`;

    const storage = getStorageProvider();
    const signedData = await storage.getSignedUploadUrl(key, mimeType);

    return NextResponse.json({
      success: true,
      key: signedData.key,
      uploadUrl: signedData.uploadUrl,
      publicUrl: signedData.publicUrl,
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate presigned upload URL" }, { status: 500 });
  }
}
