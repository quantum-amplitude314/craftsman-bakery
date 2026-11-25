import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader>
        <Link
          href="/"
          className="text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          Customer site
        </Link>
      </SiteHeader>
      <main className="flex-1">{children}</main>
    </>
  );
}
