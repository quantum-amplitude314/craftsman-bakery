"use client";

import {
  type Availability,
  NAME_MAX_LENGTH,
  type ReservationReceipt,
} from "@craftsman-bakery/contracts";
import Link from "next/link";
import { type FormEvent, startTransition, useActionState, useState } from "react";
import { reserve } from "@/app/reserve-action";
import { FormMessage } from "@/components/form-message";
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
          Plans changed?{" "}
          <Link href={`/cancel?code=${code}`} className="text-primary underline underline-offset-4">
            Cancel with the code
          </Link>{" "}
          until {formatWallClock(closesAt)}.
        </p>
        <Button variant="outline" size="lg" nativeButton={false} render={<a href="/" />}>
          Make another reservation
        </Button>
      </CardContent>
    </Card>
  );
}

/** What is left counts down as the customer adds, so it always reads against their order. */
function ProductRow({ product }: { product: Availability["products"][number] }) {
  const { productId, name, description, available } = product;
  const [quantity, setQuantity] = useState(0);
  const left = Math.max(0, available - quantity);

  return (
    <li className="flex items-center gap-4 py-3">
      <div className="flex-1 space-y-0.5">
        <Label htmlFor={quantityFieldOf(productId)} className="text-base">
          {name}
        </Label>
        {/* 90 % keeps 4.8:1 on the card, just above WCAG AA for small text. */}
        {description ? <p className="text-muted-foreground/90 text-sm">{description}</p> : null}
        <p className={available > 0 ? "text-muted-foreground text-sm" : "text-destructive text-sm"}>
          {available > 0 ? `${left} left` : "Sold out"}
        </p>
      </div>
      <QuantityStepper
        id={quantityFieldOf(productId)}
        name={quantityFieldOf(productId)}
        productName={name}
        max={available}
        quantity={quantity}
        onQuantityChange={setQuantity}
      />
    </li>
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
              {products.map((product) => (
                <ProductRow key={product.productId} product={product} />
              ))}
            </ul>
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
