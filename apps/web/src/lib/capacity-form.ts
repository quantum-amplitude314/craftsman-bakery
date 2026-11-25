import { capacityInputSchema } from "@craftsman-bakery/contracts";
import { ORPCError } from "@orpc/client";
import { z } from "zod";

export const CAPACITY_MAX = 9999;

const CAPACITY_FIELD_PREFIX = "capacity:";

export const capacityFieldOf = (productId: string) => `${CAPACITY_FIELD_PREFIX}${productId}`;

export type CapacityState =
  | { status: "editing" }
  | { status: "saved" }
  | { status: "invalid"; productIds: string[] }
  | { status: "below-reserved"; productIds: string[] }
  | { status: "signed-out" }
  | { status: "failed" };

const changeSchema = capacityInputSchema.extend({
  capacity: z.string().trim().regex(/^\d+$/).transform(Number).pipe(z.int().max(CAPACITY_MAX)),
});

/** The form carries only the capacities that differ from the current ones. */
export const readCapacityChanges = (formData: FormData) => {
  const pickupDay = formData.get("pickupDay");
  const parsedChanges = [...formData.entries()]
    .filter(([field]) => field.startsWith(CAPACITY_FIELD_PREFIX))
    .map(([field, capacity]) => {
      const productId = field.slice(CAPACITY_FIELD_PREFIX.length);
      const parsed = changeSchema.safeParse({ pickupDay, productId, capacity });

      return { productId, parsed };
    });
  const invalidProductIds = parsedChanges
    .filter(({ parsed }) => !parsed.success)
    .map(({ productId }) => productId);
  if (invalidProductIds.length > 0)
    return { status: "invalid" as const, productIds: invalidProductIds };

  const valid = {
    status: "valid" as const,
    changes: parsedChanges.flatMap(({ parsed }) => (parsed.success ? [parsed.data] : [])),
  };

  return valid;
};

const errorCodeOf = (error: unknown) => (error instanceof ORPCError ? error.code : "FAILED");

export const capacitySaveOutcomeOf = (
  results: { productId: string; error?: unknown }[],
): CapacityState => {
  const failures = results.flatMap(({ productId, error }) =>
    error === undefined ? [] : [{ productId, code: errorCodeOf(error) }],
  );
  if (failures.some(({ code }) => code === "UNAUTHORIZED")) return { status: "signed-out" };
  if (failures.some(({ code }) => code !== "CAPACITY_BELOW_RESERVED")) return { status: "failed" };
  if (failures.length > 0)
    return { status: "below-reserved", productIds: failures.map(({ productId }) => productId) };

  return { status: "saved" };
};
