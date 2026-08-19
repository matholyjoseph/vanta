import * as React from "react";
import type { Metadata } from "next";
import { getAdminUsersAction, getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminUsersClient } from "@/components/admin/admin-users-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "User Management — VANTA AI Admin",
  description: "Inspect users, manage roles, adjust credit wallets, and enforce suspensions.",
};

export default async function AdminUsersPage() {
  const [userData, stats] = await Promise.all([
    getAdminUsersAction(),
    getAdminOverviewAction(),
  ]);

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <AdminUsersClient
          initialUsers={userData.users as any}
          totalCount={userData.totalCount}
          totalPages={userData.totalPages}
          currentPage={userData.currentPage}
          adminRole={stats.adminRole}
        />
      </AdminLayout>
    </ToastProvider>
  );
}
