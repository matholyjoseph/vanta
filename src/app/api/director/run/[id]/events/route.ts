import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthenticatedOrGuestUser();

  const run = await db.directorRun.findFirst({
    where: { id, userId: user.id },
  });

  if (!run) {
    return NextResponse.json({ error: "Director run not found" }, { status: 404 });
  }

  const events = await db.directorEvent.findMany({
    where: { directorRunId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({
    status: run.status,
    currentStage: run.currentStage,
    progress: run.progress,
    events,
  });
}
