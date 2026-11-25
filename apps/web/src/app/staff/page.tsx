import type { Metadata } from "next";
import { SessionExpired } from "@/components/session-expired";
import { Button } from "@/components/ui/button";
import { getStaffSession } from "@/lib/auth";
import { signOut } from "./auth-actions";

export const metadata: Metadata = { title: "Staff · Craftsman Bakery" };

export default async function StaffPage() {
  const session = await getStaffSession();
  if (!session) return <SessionExpired />;

  const { user } = session;

  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 pt-24 pb-12 lg:max-w-5xl">
      <div className="space-y-1">
        <h1 className="font-heading font-semibold text-3xl">Staff</h1>
        <p className="text-muted-foreground">Signed in as {user.name}.</p>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </section>
  );
}
