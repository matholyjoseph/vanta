import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();

    const creatorType = body.creatorType || (Array.isArray(body.creatorTypes) ? body.creatorTypes.join(", ") : "");
    const aspectRatio = body.aspectRatio || "16:9";
    const userId = session?.user?.id || body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Missing user reference" },
        { status: 401 }
      );
    }

    // Upsert user preference
    const preference = await db.userPreference.upsert({
      where: { userId },
      update: {
        creatorType,
        aspectRatio,
        onboardingCompleted: true,
      },
      create: {
        userId,
        creatorType,
        aspectRatio,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      preference,
    });
  } catch (error) {
    console.error("Preference save error:", error);
    return NextResponse.json(
      { error: "Failed to save user preferences." },
      { status: 500 }
    );
  }
}
