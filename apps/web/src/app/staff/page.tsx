import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionError } from "@/components/section-error";
import { StaffDay, StaffDaySkeleton } from "@/components/staff-day";
import { StaffGreeting, StaffGreetingSkeleton } from "@/components/staff-greeting";
import { Button } from "@/components/ui/button";
import { signOut } from "./auth-actions";

export const metadata: Metadata = { title: "Staff · Craftsman Bakery" };

export default function StaffPage({ searchParams }: PageProps<"/staff">) {
  return (
    <section className="mx-auto max-w-2xl space-y-8 px-4 pt-24 pb-12 lg:max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionError>
          <Suspense fallback={<StaffGreetingSkeleton />}>
            <StaffGreeting />
          </Suspense>
        </SectionError>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
      <SectionError>
        <Suspense fallback={<StaffDaySkeleton />}>
          <StaffDay searchParams={searchParams} />
        </Suspense>
      </SectionError>
      <p className="text-right text-muted-foreground text-xs">
        Suggestions come from Clef, Cloudflare&apos;s small decision model, which predicts from the
        bakery&apos;s recent bakes and reservations. Staff decide.
      </p>
    </section>
  );
}
