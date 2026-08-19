import * as React from "react";
import type { Metadata } from "next";
import { getWebhookEndpointsAction } from "@/app/actions/developer-actions";
import { WebhooksClient } from "@/components/developers/webhooks-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Outbound Webhooks — Developer Portal",
  description: "Configure signed HMAC-SHA256 outbound webhooks for event notifications.",
};

export default async function WebhooksPage() {
  const endpoints = await getWebhookEndpointsAction();

  return (
    <ToastProvider>
      <WebhooksClient initialEndpoints={endpoints} />
    </ToastProvider>
  );
}
