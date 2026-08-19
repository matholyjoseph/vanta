import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Admin Dashboard — VANTA AI Control Center",
  description: "Platform analytics, KPIs, provider health, and operational monitoring.",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminOverviewAction();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <AdminDashboardClient stats={stats} />
      </AdminLayout>
    </ToastProvider>
  );
}
