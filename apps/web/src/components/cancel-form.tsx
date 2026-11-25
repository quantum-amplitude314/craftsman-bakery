"use client";

import { CODE_LENGTH } from "@craftsman-bakery/contracts";
import { useSearchParams } from "next/navigation";
import { type FormEvent, startTransition, useActionState, useState } from "react";
import { cancel } from "@/app/cancel-action";
import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type CancelFormField, type CancelState, readCancelForm } from "@/lib/cancel-form";
import { focusFirstInvalid, useFieldErrors } from "@/lib/use-field-errors";

const INITIAL_STATE: CancelState = { status: "editing", attempt: 0 };

const FIELD_HINTS: Record<CancelFormField, string> = {
  code: "Enter the 4-character code from your reservation.",
  turnstile: "Complete the check above the button.",
};

function StatusMessage({ state }: { state: CancelState }) {
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
    case "not-found":
      return <FormMessage>No reservation has that code. Check it and try again.</FormMessage>;
    case "closed":
      return (
        <FormMessage>
          Online cancelling has closed for this pickup day; please call the bakery.
        </FormMessage>
      );
    case "turnstile-failed":
      return (
        <FormMessage>
          The check did not pass; nothing was cancelled. Complete it again and resubmit.
        </FormMessage>
      );
    case "failed":
      return (
        <FormMessage>Something went wrong; nothing was cancelled. Please try again.</FormMessage>
      );
    default:
      return null;
  }
}

function Cancelled({ code }: { code: string }) {
  return (
    <Card aria-live="polite">
      <CardHeader>
        <CardTitle className="text-xl">Cancelled</CardTitle>
        <CardDescription>
          Reservation <span className="font-mono text-foreground tracking-[0.2em]">{code}</span> is
          cancelled; we will not bake it for you.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function CancelForm({ initialCode }: { initialCode: string }) {
  const [state, dispatch, pending] = useActionState(cancel, INITIAL_STATE);
  const [hasToken, setHasToken] = useState(false);
  const { setInvalidFields, errorOf, clearError, ariaOf } = useFieldErrors(FIELD_HINTS);

  if (state.status === "cancelled") return <Cancelled code={state.code} />;

  // An action passed as `action` resets the form after it runs; submitting by hand keeps the input.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { currentTarget: formElement } = event;
    const formData = new FormData(formElement);
    const form = readCancelForm(formData);
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
        <CardContent className="space-y-2">
          <Label htmlFor="code">Reservation code</Label>
          <Input
            id="code"
            name="code"
            defaultValue={initialCode}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={CODE_LENGTH}
            required
            className="h-14 text-center font-mono text-3xl uppercase tracking-[0.3em] md:text-3xl"
            onChange={() => clearError("code")}
            {...ariaOf("code")}
          />
          <FieldError field="code" message={errorOf("code")} />
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
        variant="destructive"
        size="lg"
        className="h-12 w-full text-base"
        disabled={pending || !hasToken}
      >
        {pending ? "Cancelling…" : "Cancel reservation"}
      </Button>
    </form>
  );
}

export function CancelFormFromQuery() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";

  return <CancelForm initialCode={code} />;
}
