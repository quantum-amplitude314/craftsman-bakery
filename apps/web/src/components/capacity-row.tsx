"use client";

import type { DayCapacity } from "@craftsman-bakery/contracts";
import { type FormEvent, startTransition, useActionState, useState } from "react";
import { saveCapacity } from "@/app/staff/day-actions";
import { FieldError } from "@/components/field-error";
import { SessionExpired } from "@/components/session-expired";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CAPACITY_MAX, type CapacityState, readCapacityForm } from "@/lib/capacity-form";

type ProductCapacity = DayCapacity["products"][number];

const INITIAL_STATE: CapacityState = { status: "editing" };

const statusMessageOf = ({ state, reserved }: { state: CapacityState; reserved: number }) => {
  switch (state.status) {
    case "saved":
      return { text: "Saved.", isError: false };
    case "below-reserved":
      return { text: `Cannot go below the ${reserved} reserved.`, isError: true };
    case "not-found":
      return { text: "This product no longer exists.", isError: true };
    case "invalid":
    case "failed":
      return { text: "Could not save. Try again.", isError: true };
    default:
      return null;
  }
};

export function CapacityRow({
  pickupDay,
  product,
}: {
  pickupDay: string;
  product: ProductCapacity;
}) {
  const { productId, name, capacity, reserved } = product;
  const [state, dispatch, pending] = useActionState(saveCapacity, INITIAL_STATE);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  if (state.status === "signed-out") return <SessionExpired />;

  const field = `capacity-${productId}`;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (readCapacityForm(formData).status === "invalid") {
      setIsInvalid(true);
      document.getElementById(field)?.focus();
      return;
    }
    setIsInvalid(false);
    setIsEdited(false);
    startTransition(() => dispatch(formData));
  };
  const statusMessage = isEdited ? null : statusMessageOf({ state, reserved });

  return (
    <form onSubmit={submit} noValidate className="space-y-1 py-3">
      <input type="hidden" name="pickupDay" value={pickupDay} />
      <input type="hidden" name="productId" value={productId} />
      <div className="flex items-center gap-3">
        <Label htmlFor={field} className="flex-1">
          {name}
        </Label>
        <span className="text-muted-foreground text-sm tabular-nums">{reserved} reserved</span>
        <Input
          id={field}
          name="capacity"
          type="number"
          inputMode="numeric"
          min={0}
          max={CAPACITY_MAX}
          step={1}
          defaultValue={capacity ?? ""}
          placeholder="–"
          className="w-20 text-right tabular-nums"
          aria-invalid={isInvalid || undefined}
          aria-describedby={isInvalid ? `${field}-error` : undefined}
          onChange={() => {
            setIsInvalid(false);
            setIsEdited(true);
          }}
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      <FieldError
        field={field}
        message={isInvalid ? `A whole number from 0 to ${CAPACITY_MAX}.` : undefined}
      />
      {statusMessage ? (
        <p
          role={statusMessage.isError ? "alert" : "status"}
          className={
            statusMessage.isError ? "text-destructive text-sm" : "text-muted-foreground text-sm"
          }
        >
          {statusMessage.text}
        </p>
      ) : null}
    </form>
  );
}
