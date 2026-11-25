import { capacityInputSchema } from "@craftsman-bakery/contracts";
import { ORPCError } from "@orpc/client";
import { z } from "zod";

export const CAPACITY_MAX = 9999;

export type CapacityState =
  | { status: "editing" }
  | { status: "invalid" }
  | { status: "saved" }
  | { status: "below-reserved" }
  | { status: "not-found" }
  | { status: "signed-out" }
  | { status: "failed" };

const formSchema = capacityInputSchema.extend({
  capacity: z.string().trim().regex(/^\d+$/).transform(Number).pipe(z.int().max(CAPACITY_MAX)),
});

export const readCapacityForm = (formData: FormData) => {
  const parsed = formSchema.safeParse({
    pickupDay: formData.get("pickupDay"),
    productId: formData.get("productId"),
    capacity: formData.get("capacity") ?? "",
  });
  if (!parsed.success) return { status: "invalid" as const };

  const valid = { status: "valid" as const, input: parsed.data };

  return valid;
};

const FAILURES_BY_CODE: Record<string, CapacityState> = {
  CAPACITY_BELOW_RESERVED: { status: "below-reserved" },
  NOT_FOUND: { status: "not-found" },
  UNAUTHORIZED: { status: "signed-out" },
};

export const capacityFailureOf = (error: unknown): CapacityState => {
  const failure = error instanceof ORPCError ? FAILURES_BY_CODE[error.code] : undefined;

  return failure ?? { status: "failed" };
};
