"use client";

import { type FormEvent, startTransition, useActionState } from "react";
import { signIn } from "@/app/staff/auth-actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SignInFormField, SignInState } from "@/lib/sign-in-form";

const INITIAL_STATE: SignInState = { status: "editing" };

const FIELD_HINTS: Record<SignInFormField, string> = {
  email: "Enter your email address.",
  password: "Enter your password.",
};

function StatusMessage({ state }: { state: SignInState }) {
  switch (state.status) {
    case "invalid":
      return (
        <FormMessage>
          <ul className="list-disc space-y-1 pl-5">
            {state.invalidFields.map((field) => (
              <li key={field}>{FIELD_HINTS[field]}</li>
            ))}
          </ul>
        </FormMessage>
      );
    case "wrong-credentials":
      return <FormMessage>The email or password is wrong.</FormMessage>;
    case "too-many-attempts":
      return <FormMessage>Too many attempts; wait a minute and try again.</FormMessage>;
    case "failed":
      return <FormMessage>Something went wrong. Please try again.</FormMessage>;
    default:
      return null;
  }
}

export function SignInForm({ email, password }: { email: string; password: string }) {
  const [state, dispatch, pending] = useActionState(signIn, INITIAL_STATE);

  // An action passed as `action` resets the form after it runs; submitting by hand keeps the input.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              defaultValue={email}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              defaultValue={password}
              required
            />
          </div>
        </CardContent>
      </Card>
      <div aria-live="polite">
        <StatusMessage state={state} />
      </div>
      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
