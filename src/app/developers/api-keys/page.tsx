import * as React from "react";
import type { Metadata } from "next";
import { getApiKeysAction } from "@/app/actions/developer-actions";
import { ApiKeysClient } from "@/components/developers/api-keys-client";
import { ToastProvider } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "API Keys — Developer Portal",
  description: "Create and manage Bearer API keys for VANTA AI API.",
};

export default async function ApiKeysPage() {
  const keys = await getApiKeysAction();

  return (
    <ToastProvider>
      <ApiKeysClient initialKeys={keys} />
    </ToastProvider>
  );
}
