import * as React from "react";
import type { Metadata } from "next";
import { getAdminOverviewAction } from "@/app/actions/admin-actions";
import { getLaunchChecklistAction } from "@/app/actions/launch-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { LaunchClient } from "@/components/admin/launch-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Launch Readiness Command Center — Admin Control Center",
  description: "Production launch checklist, security audit, backups, and infrastructure verification.",
};

export default async function AdminLaunchPage() {
  const stats = await getAdminOverviewAction();
  const checklist = await getLaunchChecklistAction();

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <LaunchClient initialChecklist={checklist} />
      </AdminLayout>
    </ToastProvider>
  );
}
