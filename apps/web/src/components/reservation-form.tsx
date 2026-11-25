"use client";

import {
  type Availability,
  NAME_MAX_LENGTH,
  type ReservationReceipt,
} from "@acme-bakery/contracts";
import { type FormEvent, startTransition, useActionState, useState } from "react";
import { reserve } from "@/app/reserve-action";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { formatDay, formatWallClock } from "@/lib/bakery-day";
import { type FormField, quantityFieldOf, type ReserveState } from "@/lib/reservation-form";

const INITIAL_STATE: ReserveState = { status: "editing", attempt: 0 };

const FIELD_HINTS: Record<FormField, string> = {
  name: "Enter your name.",
  phone: "Enter a phone number: digits and spaces, optionally starting with +.",
  items: "Choose at least one item.",
  turnstile: "Complete the check above the button.",
};

const inputClassName =
  "rounded-md border border-crust/30 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-crust";

function StatusMessage({ state, closesAt }: { state: ReserveState; closesAt: string }) {
  switch (state.status) {
    case "invalid":
      return (
        <ul className="list-disc space-y-1 pl-5">
          {state.invalidFields.map((field) => (
            <li key={field}>{FIELD_HINTS[field]}</li>
          ))}
        </ul>
      );
    case "no-longer-fits":
      return (
        <p>
          Not enough left of {state.productNames.join(", ")}; nothing was reserved. The numbers
          below are current: lower the quantity and reserve again.
        </p>
      );
    case "closed":
      return <p>Reservations for this day closed {formatWallClock(closesAt)}.</p>;
    case "turnstile-failed":
      return <p>The check did not pass; nothing was reserved. Complete it again and resubmit.</p>;
    case "failed":
      return <p>Something went wrong; nothing was reserved. Please try again.</p>;
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
    <section aria-live="polite" className="space-y-4 rounded-lg bg-white/70 p-6">
      <h2 className="font-semibold text-xl">Reserved</h2>
      <div>
        <p className="text-stone-600">Your code</p>
        <p className="font-mono text-4xl text-crust tracking-widest">{code}</p>
      </div>
      <p>Pick up on {formatDay(pickupDay)} and tell us the code at the counter.</p>
      <p className="text-stone-600">
        Plans changed? Cancel with the code until {formatWallClock(closesAt)}.
      </p>
      <a href="/" className="inline-block text-crust underline underline-offset-4">
        Make another reservation
      </a>
    </section>
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
      <ul className="divide-y divide-crust/15 rounded-lg bg-white/70">
        {products.map(({ productId, name, available }) => (
          <li key={productId} className="flex items-center gap-4 px-4 py-3">
            <label htmlFor={quantityFieldOf(productId)} className="flex-1">
              {name}
            </label>
            <span
              className={`whitespace-nowrap text-sm ${available > 0 ? "text-stone-600" : "text-crust"}`}
            >
              {available > 0 ? `${available} left` : "Sold out"}
            </span>
            <input
              id={quantityFieldOf(productId)}
              name={quantityFieldOf(productId)}
              type="number"
              inputMode="numeric"
              min={0}
              max={available}
              step={1}
              defaultValue={0}
              disabled={available === 0}
              className={`${inputClassName} w-20 text-right disabled:opacity-40`}
            />
          </li>
        ))}
      </ul>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm text-stone-600">Name</span>
          <input
            name="name"
            autoComplete="name"
            maxLength={NAME_MAX_LENGTH}
            required
            className={`${inputClassName} w-full`}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-stone-600">Phone</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            className={`${inputClassName} w-full`}
          />
        </label>
      </div>
      <TurnstileWidget key={state.attempt} onTokenChange={(token) => setHasToken(token !== null)} />
      <div aria-live="polite" className="text-crust">
        <StatusMessage state={state} closesAt={closesAt} />
      </div>
      <button
        type="submit"
        disabled={pending || !hasToken}
        className="rounded-md bg-crust px-5 py-2.5 font-medium text-linen transition-opacity disabled:opacity-50"
      >
        {pending ? "Reserving…" : "Reserve"}
      </button>
    </form>
  );
}
