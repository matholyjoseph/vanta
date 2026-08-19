import * as React from "react";
import type { Metadata } from "next";
import { getAdminModelsAction, getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminModelsClient } from "@/components/admin/admin-models-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "AI Models & Pricing — VANTA AI Admin",
  description: "Configure live AI models, credit costs, provider pricing, and margin alerts.",
};

export default async function AdminModelsPage() {
  const [modelData, stats] = await Promise.all([
    getAdminModelsAction(),
    getAdminOverviewAction(),
  ]);

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <AdminModelsClient initialModels={modelData.models as any} providers={modelData.providers} />
      </AdminLayout>
    </ToastProvider>
  );
}
