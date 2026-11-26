"use client";

import type { Availability } from "@craftsman-bakery/contracts";
import { useState } from "react";
import { QuantityStepper } from "@/components/quantity-stepper";
import { Label } from "@/components/ui/label";
import { quantityFieldOf } from "@/lib/reservation-form";

export function ProductRow({
  product,
  onQuantityChange,
}: {
  product: Availability["products"][number];
  onQuantityChange: () => void;
}) {
  const { productId, name, description, available } = product;
  const [quantity, setQuantity] = useState(0);
  const changeQuantity = (next: number) => {
    setQuantity(next);
    onQuantityChange();
  };
  const left = Math.max(0, available - quantity);

  return (
    <li className="flex items-center gap-4 py-3">
      <div className="flex-1 space-y-0.5">
        <Label htmlFor={quantityFieldOf(productId)} className="text-base">
          {name}
        </Label>
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
        onQuantityChange={changeQuantity}
      />
    </li>
  );
}
