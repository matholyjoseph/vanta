import * as React from "react";
import type { Metadata } from "next";
import { getAdminAssetsAction, getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ToastProvider } from "@/components/ui/toast";
import { FolderGit2, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Platform Assets — VANTA AI Admin",
  description: "Inspect uploaded & generated media assets across the platform.",
};

export default async function AdminAssetsPage() {
  const [assetData, stats] = await Promise.all([
    getAdminAssetsAction(),
    getAdminOverviewAction(),
  ]);

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <div className="space-y-6 font-sans">
          <div className="border-b border-border pb-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderGit2 className="h-6 w-6 text-accent" /> Platform Asset Repository
            </h1>
            <p className="text-xs text-muted mt-1 font-mono">
              {assetData.totalCount} total video, image & audio assets stored.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-background border-b border-border text-muted uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Resolution</th>
                    <th className="p-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assetData.assets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted">
                        No assets found.
                      </td>
                    </tr>
                  ) : (
                    assetData.assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-surface-hover transition-colors">
                        <td className="p-4 font-bold text-foreground font-sans truncate max-w-xs">
                          {asset.name}
                        </td>
                        <td className="p-4 text-muted">{asset.user?.email || "Anonymous"}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-[10px]">
                            {asset.type}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted">{asset.resolution || "1080p"}</td>
                        <td className="p-4 text-muted">{new Date(asset.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ToastProvider>
  );
}
