import type { Metadata } from "next";
import Link from "next/link";
import { CancelForm } from "@/components/cancel-form";

export const metadata: Metadata = { title: "Cancel a reservation · Craftsman Bakery" };

export default async function CancelPage({ searchParams }: PageProps<"/cancel">) {
  const { code } = await searchParams;
  const initialCode = typeof code === "string" ? code : "";

  return (
    <section className="mx-auto max-w-md space-y-6 px-4 pt-24 pb-12">
      <div className="space-y-1">
        <h1 className="font-heading font-semibold text-3xl">Cancel a reservation</h1>
        <p className="text-muted-foreground">
          Enter the code from your reservation. Cancelling works until reservations close for its
          pickup day.
        </p>
      </div>
      <CancelForm initialCode={initialCode} />
      <p className="text-center text-muted-foreground text-sm">
        <Link href="/" className="text-primary underline underline-offset-4">
          Back to reservations
        </Link>
      </p>
    </section>
  );
}
