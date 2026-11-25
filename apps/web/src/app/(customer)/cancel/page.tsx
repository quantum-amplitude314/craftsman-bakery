import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CancelForm, CancelFormFromQuery } from "@/components/cancel-form";

export const metadata: Metadata = { title: "Cancel a reservation · Craftsman Bakery" };

export default function CancelPage() {
  return (
    <section className="mx-auto max-w-md space-y-6 px-4 pt-24 pb-12">
      <div className="space-y-1">
        <h1 className="font-heading font-semibold text-3xl">Cancel a reservation</h1>
        <p className="text-muted-foreground">
          Enter the code from your reservation. Cancelling works until reservations close for its
          pickup day.
        </p>
      </div>
      <Suspense fallback={<CancelForm initialCode="" />}>
        <CancelFormFromQuery />
      </Suspense>
      <p className="text-center text-muted-foreground text-sm">
        <Link href="/" className="text-primary underline underline-offset-4">
          Back to reservations
        </Link>
      </p>
    </section>
  );
}
