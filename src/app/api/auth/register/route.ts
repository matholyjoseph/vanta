import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signUpSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = signUpSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Invalid fields",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and linked preferences
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        preference: {
          create: {
            creatorType: "",
            aspectRatio: "16:9",
            onboardingCompleted: false,
          },
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    // Check for active GuestSession and transfer Guest creations
    try {
      const cookieStore = await cookies();
      const rawToken = cookieStore.get("vanta_guest_session")?.value;
      if (rawToken) {
        const crypto = await import("crypto");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const guestSession = await db.guestSession.findUnique({ where: { sessionTokenHash: tokenHash } });
        if (guestSession) {
          const { convertGuestToUser } = await import("@/lib/guest-auth");
          await convertGuestToUser(guestSession.id, user.id);
        }
      }
    } catch {
      // Non-critical background conversion
    }

    return NextResponse.json(
      {
        message: "Account created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during account creation." },
      { status: 500 }
    );
  }
}
