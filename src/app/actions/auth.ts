"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GUEST_COOKIE_NAME } from "@/lib/guest-auth";
import { TEST_MODE_CONFIG } from "@/lib/test-mode-config";
import {
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export async function signUpAction(formData: unknown) {
  try {
    console.log("[REGISTER_MILESTONE] 1. START");
    const validated = signUpSchema.safeParse(formData);
    if (!validated.success) {
      const firstIssue = validated.error.issues[0];
      return {
        success: false,
        error: "INVALID_FIELDS",
        message: firstIssue?.message || "Invalid registration details.",
      };
    }

    const { name, email, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();
    console.log("[REGISTER_MILESTONE] 2. VALIDATED", { email: normalizedEmail });

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      console.log("[REGISTER_MILESTONE] 3. DUPLICATE_EMAIL_FOUND");
      return {
        success: false,
        error: "DUPLICATE_EMAIL",
        message: "An account with this email already exists.",
      };
    }

    console.log("[REGISTER_MILESTONE] 3. EMAIL_AVAILABLE");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User, CreditWallet, Subscription, and UserPreference in transaction
    const user = await db.$transaction(async (tx) => {
      console.log("[REGISTER_MILESTONE] 4. USER_CREATE_START");
      const newUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
        },
      });
      console.log("[REGISTER_MILESTONE] 5. USER_CREATED", { userId: newUser.id });

      try {
        await tx.creditWallet.create({
          data: {
            userId: newUser.id,
            balance: 100,
          },
        });
        console.log("[REGISTER_MILESTONE] 6. WALLET_CREATED");
      } catch (walletErr: any) {
        console.error("[REGISTER_MILESTONE_WARN] CreditWallet create warning:", walletErr?.message || walletErr);
      }

      try {
        let freePlan = await tx.subscriptionPlan.findUnique({ where: { key: "FREE" } });
        if (!freePlan) {
          freePlan = await tx.subscriptionPlan.create({
            data: {
              key: "FREE",
              name: "Free Plan",
              description: "Standard generation features for creators",
              monthlyPrice: 0,
              annualPrice: 0,
              monthlyCredits: 100,
              maxConcurrentGenerations: 1,
              maxResolution: "1080p",
              storageLimit: "10GB",
              generationPriority: "Standard",
              commercialUsage: true,
              features: JSON.stringify(["100 Monthly Credits", "720p & 1080p Resolution", "1 Concurrent Render Job"]),
            },
          });
        }
        await tx.subscription.create({
          data: {
            userId: newUser.id,
            planId: freePlan.id,
            status: "active",
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        console.log("[REGISTER_MILESTONE] 7. SUBSCRIPTION_CREATED");
      } catch (subErr: any) {
        console.error("[REGISTER_MILESTONE_WARN] Subscription create warning:", subErr?.message || subErr);
      }

      try {
        await tx.userPreference.create({
          data: {
            userId: newUser.id,
            creatorType: "",
            aspectRatio: "16:9",
            onboardingCompleted: false,
          },
        });
        console.log("[REGISTER_MILESTONE] 8. PREFERENCE_CREATED");
      } catch (prefErr: any) {
        console.error("[REGISTER_MILESTONE_WARN] UserPreference create warning:", prefErr?.message || prefErr);
      }

      return newUser;
    });

    // Check for active GuestSession and transfer Guest creations
    try {
      const cookieStore = await cookies();
      const rawToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;
      if (rawToken) {
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const guestSession = await db.guestSession.findUnique({ where: { sessionTokenHash: tokenHash } });
        if (guestSession) {
          const { convertGuestToUser } = await import("@/lib/guest-auth");
          await convertGuestToUser(guestSession.id, user.id);
          console.log("[REGISTER_MILESTONE] 9. GUEST_CONVERTED", { guestSessionId: guestSession.id });
        }
      }
    } catch (guestErr: any) {
      console.error("[REGISTER_MILESTONE_WARN] Guest conversion warning:", guestErr?.message || guestErr);
    }

    console.log("[REGISTER_MILESTONE] 10. REGISTER_SUCCESS", { userId: user.id });
    return { success: true, userId: user.id, email: user.email };
  } catch (err: any) {
    console.error("[signUpAction Server Exception]", err?.message || err);
    if (err?.message?.includes("P2002") || err?.message?.includes("Unique constraint")) {
      return {
        success: false,
        error: "DUPLICATE_EMAIL",
        message: "An account with this email already exists.",
      };
    }
    return {
      success: false,
      error: "SERVER_ERROR",
      message: "Unable to create your account right now. Please try again.",
    };
  }
}

export async function requestPasswordResetAction(formData: unknown) {
  const validated = forgotPasswordSchema.safeParse(formData);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message || "Invalid email address");
  }

  const normalizedEmail = validated.data.email.toLowerCase().trim();

  // Find user silently (privacy preserving)
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (user) {
    // Generate secure 32-byte hex token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.upsert({
      where: { email_token: { email: normalizedEmail, token } },
      create: {
        email: normalizedEmail,
        token,
        expires,
      },
      update: {
        expires,
      },
    });

    console.log(`[DEV MODE PASSWORD RESET LINK]: /auth/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`);
  }

  // Always return identical privacy-preserving message
  return {
    success: true,
    message: "If an account exists for that email, we've sent password reset instructions.",
  };
}

export async function checkEmailExistsAction(email: string) {
  return requestPasswordResetAction({ email });
}

export async function resetPasswordAction(formData: { token: string; email: string; password: string; confirmPassword: string }) {
  const validated = resetPasswordSchema.safeParse(formData);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message || "Invalid password data");
  }

  const { token, email, password } = formData;
  const normalizedEmail = email.toLowerCase().trim();

  const resetRecord = await db.passwordResetToken.findFirst({
    where: {
      email: normalizedEmail,
      token,
      expires: { gt: new Date() },
    },
  });

  if (!resetRecord) {
    throw new Error("Invalid or expired password reset token. Please request a new reset link.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.$transaction([
    db.user.update({
      where: { email: normalizedEmail },
      data: { password: hashedPassword },
    }),
    db.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    }),
  ]);

  return { success: true };
}

export async function updateProfileAction(data: { name: string; aspectRatio?: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name: data.name },
  });

  if (data.aspectRatio) {
    await db.userPreference.upsert({
      where: { userId: session.user.id },
      update: { aspectRatio: data.aspectRatio },
      create: { userId: session.user.id, aspectRatio: data.aspectRatio },
    });
  }

  return { success: true };
}

export async function changePasswordAction(data: { currentPassword: string; newPassword: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.password) {
    throw new Error("Account password not set.");
  }

  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) {
    throw new Error("Current password is incorrect.");
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 10);
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  return { success: true };
}

export async function deleteAccountAction() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db.user.delete({
    where: { id: session.user.id },
  });

  return { success: true };
}

export async function continueAsGuestAction() {
  try {
    const cookieStore = await cookies();
    const existingToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;
    const rawToken = existingToken || crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + TEST_MODE_CONFIG.GUEST_SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    // Try saving / updating session in database if available
    try {
      const session = await db.guestSession.findUnique({
        where: { sessionTokenHash: tokenHash },
      });
      if (session) {
        await db.guestSession.update({
          where: { id: session.id },
          data: { lastActiveAt: new Date() },
        });
      } else {
        await db.guestSession.create({
          data: {
            sessionTokenHash: tokenHash,
            testCreditBalance: TEST_MODE_CONFIG.GUEST_TEST_CREDITS,
            status: "ACTIVE",
            expiresAt,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[continueAsGuestAction] Database write skipped (using cookie session):", dbErr);
    }

    // Always set guest cookie
    cookieStore.set(GUEST_COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  } catch (err) {
    console.error("[continueAsGuestAction Error]", err);
  }

  // CRITICAL: redirect MUST be called OUTSIDE any try/catch block in Next.js App Router!
  redirect("/dashboard");
}
