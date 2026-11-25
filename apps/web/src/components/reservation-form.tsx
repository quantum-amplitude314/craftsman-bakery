"use client";

import {
  type Availability,
  NAME_MAX_LENGTH,
  type ReservationReceipt,
} from "@acme-bakery/contracts";
import { type FormEvent, startTransition, useActionState, useState } from "react";
import { reserve } from "@/app/reserve-action";
import { QuantityStepper } from "@/components/quantity-stepper";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDay, formatWallClock } from "@/lib/bakery-day";
import { type FormField, quantityFieldOf, type ReserveState } from "@/lib/reservation-form";

const INITIAL_STATE: ReserveState = { status: "editing", attempt: 0 };

const FIELD_HINTS: Record<FormField, string> = {
  name: "Enter your name.",
  phone: "Enter a phone number: digits and spaces, optionally starting with +.",
  items: "Choose at least one item.",
  turnstile: "Complete the check above the button.",
};

const MESSAGE_CLASS_NAME =
  "rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive";

function StatusMessage({ state, closesAt }: { state: ReserveState; closesAt: string }) {
  switch (state.status) {
    case "invalid":
      return (
        <ul className={`${MESSAGE_CLASS_NAME} list-disc space-y-1 pl-9`}>
          {state.invalidFields.map((field) => (
            <li key={field}>{FIELD_HINTS[field]}</li>
          ))}
        </ul>
      );
    case "no-longer-fits":
      return (
        <p className={MESSAGE_CLASS_NAME}>
          Not enough left of {state.productNames.join(", ")}; nothing was reserved. The numbers
          below are current: lower the quantity and reserve again.
        </p>
      );
    case "closed":
      return (
        <p className={MESSAGE_CLASS_NAME}>
          Reservations for this day closed {formatWallClock(closesAt)}.
        </p>
      );
    case "turnstile-failed":
      return (
        <p className={MESSAGE_CLASS_NAME}>
          The check did not pass; nothing was reserved. Complete it again and resubmit.
        </p>
      );
    case "failed":
      return (
        <p className={MESSAGE_CLASS_NAME}>
          Something went wrong; nothing was reserved. Please try again.
        </p>
      );
    default:
      return null;
  }
}

function Receipt({
  receipt: { code, pickupDay },
  closesAt,
}: {
  receipt: ReservationReceipt;
  closesAt: string;
}) {
  return (
    <Card aria-live="polite">
      <CardHeader>
        <CardTitle className="text-xl">Reserved</CardTitle>
        <CardDescription>Pick up on {formatDay(pickupDay)}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground text-sm">Your code, to tell us at the counter</p>
          <p className="font-mono text-5xl text-primary tracking-[0.2em]">{code}</p>
        </div>
        <p className="text-muted-foreground">
          Plans changed? Cancel with the code until {formatWallClock(closesAt)}.
        </p>
        <Button variant="outline" size="lg" nativeButton={false} render={<a href="/" />}>
          Make another reservation
        </Button>
      </CardContent>
    </Card>
  );
}

export function ReservationForm({ availability }: { availability: Availability }) {
  const [state, dispatch, pending] = useActionState(reserve, INITIAL_STATE);
  const [hasToken, setHasToken] = useState(false);

  if (state.status === "reserved") {
    return <Receipt receipt={state.receipt} closesAt={availability.closesAt} />;
  }

  const { pickupDay, closesAt, products } =
    state.status === "no-longer-fits" ? state.availability : availability;

  // An action passed as `action` resets the form after it runs; submitting by hand keeps the input.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <input type="hidden" name="pickupDay" value={pickupDay} />
      {/* Desktop: the order on the left, details and submitting on the right. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What would you like?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {products.map(({ productId, name, available }) => (
                <li key={productId} className="flex items-center gap-4 py-3">
                  <div className="flex-1">
                    <Label htmlFor={quantityFieldOf(productId)} className="text-base">
                      {name}
                    </Label>
                    <p
                      className={
                        available > 0 ? "text-muted-foreground text-sm" : "text-destructive text-sm"
                      }
                    >
                      {available > 0 ? `${available} left` : "Sold out"}
                    </p>
                  </div>
                  <QuantityStepper
                    id={quantityFieldOf(productId)}
                    name={quantityFieldOf(productId)}
                    productName={name}
                    max={available}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your details</CardTitle>
              <CardDescription>So we know whose order it is when you pick it up.</CardDescription>
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
                />
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
                />
              </div>
            </CardContent>
          </Card>
          <TurnstileWidget
            key={state.attempt}
            onTokenChange={(token) => setHasToken(token !== null)}
          />
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
