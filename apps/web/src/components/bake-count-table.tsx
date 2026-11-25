"use client";

import type { DayCapacity } from "@craftsman-bakery/contracts";
import { type FormEvent, startTransition, useActionState, useState } from "react";
import { saveCapacities } from "@/app/staff/day-actions";
import { FieldError } from "@/components/field-error";
import { SessionExpired } from "@/components/session-expired";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CAPACITY_MAX,
  type CapacityState,
  capacityFieldOf,
  readCapacityChanges,
} from "@/lib/capacity-form";
import { focusFirstInvalid } from "@/lib/use-field-errors";

type ProductCapacity = DayCapacity["products"][number];

const INITIAL_STATE: CapacityState = { status: "editing" };

const rowErrorOf = ({
  product: { productId, reserved },
  invalidProductIds,
  state,
}: {
  product: ProductCapacity;
  invalidProductIds: string[];
  state: CapacityState;
}) => {
  if (invalidProductIds.includes(productId)) return `A whole number from 0 to ${CAPACITY_MAX}.`;
  if (state.status === "below-reserved" && state.productIds.includes(productId))
    return `Cannot go below the ${reserved} reserved.`;

  return undefined;
};

function ProductRow({
  product,
  error,
  onEdit,
}: {
  product: ProductCapacity;
  error: string | undefined;
  onEdit: () => void;
}) {
  const { productId, name, capacity, reserved } = product;
  const field = capacityFieldOf(productId);

  return (
    <tr>
      <th scope="row" className="py-2 pr-4 text-left font-normal">
        <label htmlFor={field}>{name}</label>
        <FieldError field={field} message={error} />
      </th>
      <td
        className={
          reserved > 0
            ? "py-2 pr-4 text-right font-medium text-base tabular-nums"
            : "py-2 pr-4 text-right text-muted-foreground tabular-nums"
        }
      >
        {reserved}
      </td>
      <td className="py-2">
        <Input
          id={field}
          name={field}
          inputMode="numeric"
          autoComplete="off"
          defaultValue={capacity ?? ""}
          placeholder="–"
          className="ml-auto h-9 w-20 text-right tabular-nums"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${field}-error` : undefined}
          onChange={onEdit}
        />
      </td>
    </tr>
  );
}

export function BakeCountTable({ pickupDay, products }: DayCapacity) {
  const [state, dispatch, pending] = useActionState(saveCapacities, INITIAL_STATE);
  const [invalidProductIds, setInvalidProductIds] = useState<string[]>([]);
  const [isEdited, setIsEdited] = useState(false);

  if (state.status === "signed-out") return <SessionExpired />;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { currentTarget: formElement } = event;
    const formData = new FormData(formElement);
    for (const { productId, capacity } of products) {
      const field = capacityFieldOf(productId);
      if (formData.get(field) === String(capacity ?? "")) formData.delete(field);
    }
    const form = readCapacityChanges(formData);
    if (form.status === "invalid") {
      setInvalidProductIds(form.productIds);
      focusFirstInvalid(formElement);
      return;
    }
    setInvalidProductIds([]);
    setIsEdited(false);
    startTransition(() => dispatch(formData));
  };
  const markEdited = () => {
    setIsEdited(true);
    setInvalidProductIds([]);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <input type="hidden" name="pickupDay" value={pickupDay} />
      <table className="w-full">
        <thead className="text-muted-foreground text-sm">
          <tr>
            <th scope="col" className="pb-2 text-left font-normal">
              Product
            </th>
            <th scope="col" className="pr-4 pb-2 text-right font-normal">
              Reserved
            </th>
            <th scope="col" className="pb-2 text-right font-normal">
              Capacity
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((product) => (
            <ProductRow
              key={product.productId}
              product={product}
              error={rowErrorOf({ product, invalidProductIds, state })}
              onEdit={markEdited}
            />
          ))}
        </tbody>
      </table>
      <div aria-live="polite" className="flex min-h-9 items-center justify-end gap-3">
        {state.status === "saved" && !isEdited ? (
          <p className="text-muted-foreground text-sm">Saved.</p>
        ) : null}
        {state.status === "failed" && !isEdited ? (
          <p role="alert" className="text-destructive text-sm">
            Could not save. Try again.
          </p>
        ) : null}
        {isEdited || pending || state.status === "failed" ? (
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
