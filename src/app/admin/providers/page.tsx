import * as React from "react";
import type { Metadata } from "next";
import { getAdminModelsAction, getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminProvidersClient } from "@/components/admin/admin-providers-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "AI Providers & Health — VANTA AI Admin",
  description: "Monitor AI provider endpoints, health status, and availability.",
};

export default async function AdminProvidersPage() {
  const [modelData, stats] = await Promise.all([
    getAdminModelsAction(),
    getAdminOverviewAction(),
  ]);

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <AdminProvidersClient providers={modelData.providers as any} />
      </AdminLayout>
    </ToastProvider>
  );
}
