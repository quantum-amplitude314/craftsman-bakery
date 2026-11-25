import type { Metadata } from "next";
import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = { title: "Staff sign-in · Craftsman Bakery" };

/** Public on purpose, so anyone can try the staff pages; the demo seed creates this account. */
const DEMO_STAFF = { email: "staff@craftsman-bakery.demo", password: "craftsman-bakery-demo" };

export default function SignInPage() {
  const { email, password } = DEMO_STAFF;

  return (
    <section className="mx-auto max-w-md space-y-6 px-4 pt-24 pb-12">
      <div className="space-y-1">
        <h1 className="font-heading font-semibold text-3xl">Staff sign-in</h1>
        <p className="text-muted-foreground">For the bakery team.</p>
      </div>
      <SignInForm email={email} password={password} />
      <aside aria-label="Demo account" className="space-y-2 rounded-2xl bg-accent/60 p-4 text-sm">
        <p className="font-medium">Demo account, filled in above</p>
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="whitespace-nowrap font-mono text-xs">{email}</dd>
          <dt className="text-muted-foreground">Password</dt>
          <dd className="whitespace-nowrap font-mono text-xs">{password}</dd>
        </dl>
      </aside>
    </section>
  );
}
