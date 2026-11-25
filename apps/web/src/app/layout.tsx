import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { getEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const TITLE = "Craftsman Bakery";
const DESCRIPTION = "Reserve bread and pastry for pickup.";
/** Written by packages/maintain/brand/build.sh; X falls back to it. */
const SHARE_IMAGE = { url: "/og-image-v2.jpg", type: "image/jpeg", width: 1200, height: 630 };

export const generateMetadata = async (): Promise<Metadata> => {
  const { WEB_ORIGIN: webOrigin } = await getEnv();
  // The icons and the share image are files in public/, served without running the Worker.
  const metadata: Metadata = {
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

  return metadata;
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="min-h-dvh antialiased">
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
