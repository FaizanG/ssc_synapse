import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  applicationName: "SSC Synapse",
  title: {
    default: "SSC Synapse",
    template: "%s | SSC Synapse",
  },
  description:
    "AI-powered catering and event intelligence for Siddique Sons Caterers.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/brand/ssc-mark.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/brand/ssc-mark.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "SSC Synapse",
    description:
      "AI-powered catering and event intelligence for Siddique Sons Caterers.",
    images: [
      {
        url: "/brand/siddique-sons-logo-transparent.png",
        width: 1792,
        height: 832,
        alt: "Siddique Sons Caterers",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
