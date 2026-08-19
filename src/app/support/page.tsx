import * as React from "react";
import type { Metadata } from "next";
import { getUserSupportTicketsAction } from "@/app/actions/support-actions";
import { SupportClient } from "@/components/support/support-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Support Center — VANTA AI",
  description: "Submit support tickets and track resolution status.",
};

export default async function SupportPage() {
  const tickets = await getUserSupportTicketsAction();

  return (
    <ToastProvider>
      <SupportClient initialTickets={tickets} />
    </ToastProvider>
  );
}
