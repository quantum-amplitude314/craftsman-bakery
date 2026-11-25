"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const clampQuantity = ({ value, max }: { value: number; max: number }) =>
  Math.min(max, Math.max(0, Math.trunc(value) || 0));

/**
 * − count + with 44 px targets. The count is a named input, so the form submits it; typing a number
 * works too and is clamped to 0..max.
 */
export function QuantityStepper({
  id,
  name,
  productName,
  max,
  quantity,
  onQuantityChange,
}: {
  id: string;
  name: string;
  productName: string;
  max: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}) {
  const isSoldOut = max === 0;

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="size-11"
        aria-label={`One ${productName} less`}
        disabled={quantity === 0}
        onClick={() => onQuantityChange(quantity - 1)}
      >
        <Minus />
      </Button>
      <Input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={quantity}
        disabled={isSoldOut}
        onChange={(event) =>
          onQuantityChange(clampQuantity({ value: Number(event.target.value), max }))
        }
        className="h-11 w-14 text-center text-base tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="size-11"
        aria-label={`One ${productName} more`}
        disabled={quantity >= max}
        onClick={() => onQuantityChange(quantity + 1)}
      >
        <Plus />
      </Button>
    </div>
  );
}
