"use client";

import { type Availability, NAME_MAX_LENGTH } from "@craftsman-bakery/contracts";
import { type FormEvent, startTransition, useActionState, useState } from "react";
import { reserve } from "@/app/reserve-action";
import { FieldError } from "@/components/field-error";
import { FormMessage } from "@/components/form-message";
import { ProductRow } from "@/components/product-row";
import { ReservationReceipt } from "@/components/reservation-receipt";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatWallClock } from "@/lib/bakery-day";
import { type FormField, type ReserveState, readReservationForm } from "@/lib/reservation-form";
import { focusFirstInvalid, useFieldErrors } from "@/lib/use-field-errors";

const INITIAL_STATE: ReserveState = { status: "editing", attempt: 0 };

const FIELD_HINTS: Record<FormField, string> = {
  name: "Enter your name.",
  phone: "Enter a phone number: digits and spaces, optionally starting with +.",
  items: "Choose at least one item.",
  turnstile: "Complete the check above the button.",
};

function StatusMessage({ state, closesAt }: { state: ReserveState; closesAt: string }) {
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
    case "no-longer-fits":
      return (
        <FormMessage>
          Not enough left of {state.productNames.join(", ")}; nothing was reserved. The numbers
          below are current: lower the quantity and reserve again.
        </FormMessage>
      );
    case "closed":
      return (
        <FormMessage>Reservations for this day closed {formatWallClock(closesAt)}.</FormMessage>
      );
    case "turnstile-failed":
      return (
        <FormMessage>
          The check did not pass; nothing was reserved. Complete it again and resubmit.
        </FormMessage>
      );
    case "failed":
      return (
        <FormMessage>Something went wrong; nothing was reserved. Please try again.</FormMessage>
      );
    default:
      return null;
  }
}

export function ReservationForm({ availability }: { availability: Availability }) {
  const [state, dispatch, pending] = useActionState(reserve, INITIAL_STATE);
  const [hasToken, setHasToken] = useState(false);
  const { setInvalidFields, errorOf, clearError, ariaOf } = useFieldErrors(FIELD_HINTS);

  if (state.status === "reserved") {
    return <ReservationReceipt receipt={state.receipt} closesAt={availability.closesAt} />;
  }

  const { pickupDay, closesAt, products } =
    state.status === "no-longer-fits" ? state.availability : availability;

  // An action passed as `action` resets the form after it runs; submitting by hand keeps the input.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { currentTarget: formElement } = event;
    const formData = new FormData(formElement);
    const form = readReservationForm(formData);
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
      <input type="hidden" name="pickupDay" value={pickupDay} />
      {/* Desktop: the order on the left, details and submitting on the right. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What would you like?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {products.map((product) => (
                <ProductRow
                  key={product.productId}
                  product={product}
                  onQuantityChange={() => clearError("items")}
                />
              ))}
            </ul>
            <FieldError field="items" message={errorOf("items")} />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  maxLength={NAME_MAX_LENGTH}
                  required
                  className="h-11"
                  onChange={() => clearError("name")}
                  {...ariaOf("name")}
                />
                <FieldError field="name" message={errorOf("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="h-11"
                  onChange={() => clearError("phone")}
                  {...ariaOf("phone")}
                />
                <FieldError field="phone" message={errorOf("phone")} />
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
            <StatusMessage state={state} closesAt={closesAt} />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full text-base"
            disabled={pending || !hasToken}
          >
            {pending ? "Reserving…" : "Reserve"}
          </Button>
        </div>
      </div>
    </form>
  );
}
