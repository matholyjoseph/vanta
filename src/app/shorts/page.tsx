import * as React from "react";
import type { Metadata } from "next";
import { getShortsProjectsAction } from "@/app/actions/shorts-actions";
import { db } from "@/lib/db";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { ShortsHomeClient } from "@/components/shorts/shorts-home-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "VANTA Shorts Studio — Turn Long Videos Into Shorts",
  description: "AI viral social clipping engine for TikTok, Instagram Reels, and YouTube Shorts.",
};

export default async function ShortsHomePage() {
  const user = await getAuthenticatedOrGuestUser();
  const projects = await getShortsProjectsAction();

  const userAssets = await db.asset.findMany({
    where: { userId: user.id, type: "VIDEO" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <ToastProvider>
      <ShortsHomeClient initialProjects={projects} userAssets={userAssets} />
    </ToastProvider>
  );
}
