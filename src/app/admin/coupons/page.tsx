import * as React from "react";
import type { Metadata } from "next";
import { getAdminCouponsAction, getAdminOverviewAction } from "@/app/actions/admin-actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminCouponsClient } from "@/components/admin/admin-coupons-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Promo Codes — VANTA AI Admin",
  description: "Create and monitor promotional vouchers and credit grants.",
};

export default async function AdminCouponsPage() {
  const [couponData, stats] = await Promise.all([
    getAdminCouponsAction(),
    getAdminOverviewAction(),
  ]);

  return (
    <ToastProvider>
      <AdminLayout userRole={stats.adminRole}>
        <AdminCouponsClient coupons={couponData.coupons as any} />
      </AdminLayout>
    </ToastProvider>
  );
}
