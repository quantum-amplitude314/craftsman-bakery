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
        <p className="text-muted-foreground">
          The demo account is filled in: <span className="text-foreground">{email}</span> with
          password <span className="font-mono text-foreground">{password}</span>.
        </p>
      </div>
      <SignInForm email={email} password={password} />
    </section>
  );
}
