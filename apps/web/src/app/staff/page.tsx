import { LogOutIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionError } from "@/components/section-error";
import { StaffDay, StaffDaySkeleton } from "@/components/staff-day";
import { StaffShell } from "@/components/staff-shell";
import { Button } from "@/components/ui/button";
import { signOut } from "./auth-actions";

export const metadata: Metadata = { title: "Staff · Craftsman Bakery" };

function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline">
        <LogOutIcon data-icon="inline-start" aria-hidden="true" />
        Sign out
      </Button>
    </form>
  );
}

export default function StaffPage({ searchParams }: PageProps<"/staff">) {
  return (
    <StaffShell actions={<SignOutButton />}>
      <section className="mx-auto max-w-2xl space-y-8 px-4 pt-24 pb-12 lg:max-w-5xl">
        <h1 className="sr-only">Staff</h1>
        <SectionError>
          <Suspense fallback={<StaffDaySkeleton />}>
            <StaffDay searchParams={searchParams} />
          </Suspense>
        </SectionError>
        <p className="text-right text-muted-foreground text-xs">
          Suggestions come from Clef, Cloudflare&apos;s small decision model, which predicts from
          the bakery&apos;s recent bakes and reservations. Staff decide.
        </p>
      </section>
    </StaffShell>
  );
}
