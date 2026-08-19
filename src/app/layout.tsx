import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vanta.ai"),
  title: "Vanta AI — Professional AI Video Generation",
  description:
    "The ultimate multi-model AI video workspace. Command industry-leading generation models with precision engineering and professional-grade controls.",
  keywords: [
    "AI video generation",
    "text to video",
    "cinematic AI",
    "video generation SaaS",
    "AI filmmaking",
    "Vanta AI",
  ],
  authors: [{ name: "Vanta AI" }],
  creator: "Vanta AI",
  openGraph: {
    title: "Vanta AI — Professional AI Video Generation",
    description:
      "Turn ideas into cinematic video. The ultimate multi-model AI video workspace with precision engineering.",
    url: "https://vanta.ai",
    siteName: "Vanta AI",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vanta AI — Professional AI Video Generation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vanta AI — Professional AI Video Generation",
    description:
      "Turn ideas into cinematic video with multi-model AI orchestration.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { SessionProviderWrapper } from "@/components/providers/session-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased overflow-x-hidden">
        <SessionProviderWrapper>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground focus:outline-none"
          >
            Skip to main content
          </a>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
