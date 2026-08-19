import * as React from "react";
import type { Metadata } from "next";
import { getAdminSettingsAction, getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminSettingsClient } from "@/components/admin/admin-settings-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Settings & Feature Flags — VANTA AI Admin",
  description: "Configure system feature flags and operational maintenance modes.",
};

export default async function AdminSettingsPage() {
  const [settingsData, stats] = await Promise.all([
    getAdminSettingsAction(),
    getAdminOverviewAction(),
  ]);

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <AdminSettingsClient
          featureFlags={settingsData.featureFlags as any}
          systemSettings={settingsData.systemSettings}
        />
      </AdminLayout>
    </ToastProvider>
  );
}
