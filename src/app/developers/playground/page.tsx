import * as React from "react";
import type { Metadata } from "next";
import { PlaygroundClient } from "@/components/developers/playground-client";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "API Playground — Developer Portal",
  description: "Interactive testing sandbox for VANTA AI REST API endpoints.",
};

export default function PlaygroundPage() {
  return (
    <ToastProvider>
      <PlaygroundClient />
    </ToastProvider>
  );
}
