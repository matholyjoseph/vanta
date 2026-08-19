import { NextResponse } from "next/server";
import { localStorageProvider } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") || `upload-${Date.now()}.bin`;

    const blob = await req.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await localStorageProvider.upload(buffer, key);

    return NextResponse.json({
      success: true,
      key: result.key,
      url: result.url,
    });
  } catch {
    return NextResponse.json({ error: "Failed to upload file to local storage" }, { status: 500 });
  }
}
