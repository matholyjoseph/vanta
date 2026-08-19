import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeyService } from "@/lib/api/api-key-service";

export async function GET(req: NextRequest) {
  const auth = await apiKeyService.authenticateBearerToken(req.headers.get("authorization"));
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json(
      { error: { type: "authentication_error", code: "unauthorized", message: auth.error } },
      { status: 401 }
    );
  }

  let wallet = await db.creditWallet.findUnique({ where: { userId: auth.userId } });
  const balance = wallet?.balance ?? 100;

  return NextResponse.json({
    object: "account_credits",
    user_id: auth.userId,
    available_credits: balance,
    currency: "VANTA_CREDIT",
  });
}
