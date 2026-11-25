import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACME Bakery",
  description: "Reserve bread and pastry for pickup.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-linen text-stone-900 antialiased">
        <header className="border-crust/20 border-b">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
            {/* biome-ignore lint/performance/noImgElement: a tiny SVG needs no optimisation */}
            <img src="/icon.svg" alt="" width={32} height={32} />
            <span className="font-semibold text-crust text-xl">ACME Bakery</span>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
