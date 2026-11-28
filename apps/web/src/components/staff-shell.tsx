import { StoreIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";

/** Staff pages: the header links back to the customer site; `actions` follow it, such as Sign out. */
export function StaffShell({ actions, children }: { actions?: ReactNode; children: ReactNode }) {
  return (
    <>
      <SiteHeader>
        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
          <StoreIcon data-icon="inline-start" aria-hidden="true" />
          Customer site
        </Link>
        {actions}
      </SiteHeader>
      <main className="flex-1">{children}</main>
    </>
  );
}
