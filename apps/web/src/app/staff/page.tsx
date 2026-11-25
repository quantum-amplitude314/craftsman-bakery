import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionError } from "@/components/section-error";
import { StaffGreeting, StaffGreetingSkeleton } from "@/components/staff-greeting";
import { Button } from "@/components/ui/button";
import { signOut } from "./auth-actions";

export const metadata: Metadata = { title: "Staff · Craftsman Bakery" };

export default function StaffPage() {
  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 pt-24 pb-12 lg:max-w-5xl">
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
    </section>
  );
}
