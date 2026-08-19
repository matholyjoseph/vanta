import * as React from "react";
import type { Metadata } from "next";
import { getAdminGenerationsAction, getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminGenerationsClient } from "@/components/admin/admin-generations-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Generations Monitoring — VANTA AI Admin",
  description: "Monitor platform render jobs, analyze failure metrics, and manage credit refunds.",
};

export default async function AdminGenerationsPage() {
  const [genData, stats] = await Promise.all([
    getAdminGenerationsAction(),
    getAdminOverviewAction(),
  ]);

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <AdminGenerationsClient
          initialGenerations={genData.generations as any}
          totalCount={genData.totalCount}
          totalPages={genData.totalPages}
          currentPage={genData.currentPage}
        />
      </AdminLayout>
    </ToastProvider>
  );
}
