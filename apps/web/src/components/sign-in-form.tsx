"use client";

import { type FormEvent, startTransition, useActionState, useState } from "react";
import { signIn } from "@/app/staff/auth-actions";
import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readSignInForm, type SignInFormField, type SignInState } from "@/lib/sign-in-form";
import { focusFirstInvalid, useFieldErrors } from "@/lib/use-field-errors";

const INITIAL_STATE: SignInState = { status: "editing", attempt: 0 };

const FIELD_HINTS: Record<SignInFormField, string> = {
  email: "Enter your email address.",
  password: "Enter your password.",
  turnstile: "Complete the check above the button.",
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
    case "turnstile-failed":
      return <FormMessage>The check did not pass. Complete it again and sign in.</FormMessage>;
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
  const [hasToken, setHasToken] = useState(false);
  const { setInvalidFields, errorOf, clearError, ariaOf } = useFieldErrors(FIELD_HINTS);

  // An action passed as `action` resets the form after it runs; submitting by hand keeps the input.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { currentTarget: formElement } = event;
    const formData = new FormData(formElement);
    const form = readSignInForm(formData);
    if (form.status === "invalid") {
      setInvalidFields(form.invalidFields);
      focusFirstInvalid(formElement);
      return;
    }
    setInvalidFields([]);
    startTransition(() => dispatch(formData));
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
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
              onChange={() => clearError("email")}
              {...ariaOf("email")}
            />
            <FieldError field="email" message={errorOf("email")} />
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
              onChange={() => clearError("password")}
              {...ariaOf("password")}
            />
            <FieldError field="password" message={errorOf("password")} />
          </div>
        </CardContent>
      </Card>
      <TurnstileWidget
        attempt={state.attempt}
        onTokenChange={(token) => {
          setHasToken(token !== null);
          clearError("turnstile");
        }}
      />
      <FieldError field="turnstile" message={errorOf("turnstile")} />
      <div aria-live="polite">
        <StatusMessage state={state} />
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-12 w-full text-base"
        disabled={pending || !hasToken}
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
