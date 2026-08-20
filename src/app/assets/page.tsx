import * as React from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getAssetsAction, getAssetFoldersAction } from "@/app/actions/assets";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AssetLibraryClient, type FolderItem } from "@/components/assets/asset-library-client";
import { type AssetItem } from "@/components/assets/asset-inspector";
import { ToastProvider } from "@/components/ui/toast";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Asset Library & Generation History — Vanta AI",
  description: "Central asset and generation history library.",
};

export default async function AssetsPage() {
  const user = await getAuthenticatedOrGuestUser();
  const userId = user.id;

  let wallet: any = null;
  try {
    wallet = await db.creditWallet.findUnique({ where: { userId } });
  } catch (err) {
    console.warn("[AssetsPage] Wallet DB read fallback:", err);
  }

  const initialAssetsData = await getAssetsAction({ page: 1, pageSize: 24 });
  const initialFolders = await getAssetFoldersAction();

  const userName = user.name || (user.email ? user.email.split("@")[0] : "Guest Creator");
  const creditBalance = wallet?.balance ?? 10000;

  return (
    <ToastProvider>
      <div className="h-screen w-full bg-background text-foreground flex overflow-hidden">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <DashboardHeader
            creditBalance={creditBalance}
            userName={userName}
            userEmail={user.email || undefined}
          />

          <main className="flex-1 overflow-hidden">
            <AssetLibraryClient
              initialAssets={initialAssetsData.assets as unknown as AssetItem[]}
              initialTotalCount={initialAssetsData.totalCount}
              initialFolders={initialFolders as unknown as FolderItem[]}
            />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
