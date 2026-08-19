import { cookies } from "next/headers";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TEST_MODE_CONFIG } from "@/lib/test-mode-config";

export const GUEST_COOKIE_NAME = "vanta_guest_session";

export interface ActorContext {
  type: "USER" | "GUEST";
  userId?: string;
  guestSessionId?: string;
  publicId?: string;
  testCredits: number;
  isGuest: boolean;
}

export async function getOrCreateGuestSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  if (rawToken) {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const session = await db.guestSession.findUnique({
      where: { sessionTokenHash: tokenHash },
    });

    if (session && session.status === "ACTIVE" && session.expiresAt > new Date()) {
      try {
        await db.guestSession.update({
          where: { id: session.id },
          data: { lastActiveAt: new Date() },
        });
      } catch {}
      return session;
    }
  }

  // Create new Guest Session
  const newRawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(newRawToken).digest("hex");
  const expiresAt = new Date(Date.now() + TEST_MODE_CONFIG.GUEST_SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

  const guestSession = await db.guestSession.create({
    data: {
      sessionTokenHash: tokenHash,
      testCreditBalance: TEST_MODE_CONFIG.GUEST_TEST_CREDITS,
      status: "ACTIVE",
      expiresAt,
    },
  });

  try {
    cookieStore.set(GUEST_COOKIE_NAME, newRawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });
  } catch {
    // Ignore cookie write errors if running in read-only server component contexts
  }

  return guestSession;
}

export async function getActorContext(): Promise<ActorContext> {
  const session = await auth();

  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { creditWallet: true },
    });

    if (user) {
      return {
        type: "USER",
        userId: user.id,
        testCredits: user.creditWallet?.balance ?? 0,
        isGuest: false,
      };
    }
  }

  // Guest Fallback
  const guest = await getOrCreateGuestSession();
  return {
    type: "GUEST",
    guestSessionId: guest.id,
    publicId: guest.publicId,
    testCredits: guest.testCreditBalance,
    isGuest: true,
  };
}

export async function convertGuestToUser(guestSessionId: string, userId: string) {
  return db.$transaction(async (tx) => {
    // 1. Transfer Guest Assets to User
    await tx.asset.updateMany({
      where: { guestSessionId },
      data: { userId, guestSessionId: null },
    });

    // 2. Transfer Guest Generations to User
    await tx.generation.updateMany({
      where: { guestSessionId },
      data: { userId, guestSessionId: null },
    });

    // 3. Mark GuestSession as CONVERTED
    return tx.guestSession.update({
      where: { id: guestSessionId },
      data: { status: "CONVERTED", convertedUserId: userId },
    });
  });
}

// Legacy helper for backward compatibility
export async function getAuthenticatedOrGuestUser() {
  const actor = await getActorContext();
  if (actor.type === "USER" && actor.userId) {
    const user = await db.user.findUnique({
      where: { id: actor.userId },
      include: { creditWallet: true, subscription: { include: { plan: true } } },
    });
    if (user) return user;
  }

  // Ensure default fallback user object for older APIs expecting User structure
  return {
    id: actor.guestSessionId || "guest-user-id",
    email: "guest@vanta.ai",
    name: "Guest User",
    role: "USER",
    creditWallet: { balance: actor.testCredits },
    isGuest: true,
  } as any;
}

export async function getAuthenticatedOrGuestUserId(): Promise<string> {
  const user = await getAuthenticatedOrGuestUser();
  return user.id;
}
