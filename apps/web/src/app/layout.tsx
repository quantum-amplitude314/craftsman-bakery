import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const TITLE = "Craftsman Bakery";
const DESCRIPTION = "Reserve bread and pastry for pickup.";
/** Written by packages/maintain/brand/build.sh; X falls back to it. */
const SHARE_IMAGE = { url: "/og-image-v2.jpg", type: "image/jpeg", width: 1200, height: 630 };

const { NEXT_PUBLIC_WEB_ORIGIN: webOrigin } = publicEnv;

export const metadata: Metadata = {
  metadataBase: new URL(webOrigin),
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
  },
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: { ...SHARE_IMAGE, alt: TITLE },
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  );
}
