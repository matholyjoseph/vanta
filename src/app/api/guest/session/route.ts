import { NextResponse } from "next/server";
import { getOrCreateGuestSession } from "@/lib/guest-auth";

export async function POST() {
  try {
    const guestSession = await getOrCreateGuestSession();

    return NextResponse.json({
      success: true,
      guestSessionId: guestSession.id,
      publicId: guestSession.publicId,
      testCredits: guestSession.testCreditBalance,
    });
  } catch (error) {
    console.error("[GuestSession] Failed to provision guest session:", error);
    return NextResponse.json(
      { error: "Unable to start Test Mode. Please try again." },
      { status: 500 }
    );
  }
}
