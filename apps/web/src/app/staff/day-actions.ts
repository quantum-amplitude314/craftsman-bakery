"use server";

import { capacityInputSchema, codeSchema, pickupDaySchema } from "@craftsman-bakery/contracts";
import { refresh } from "next/cache";
import { z } from "zod";
import { apiClient } from "@/lib/api";
import {
  type CapacityState,
  capacitySaveOutcomeOf,
  readCapacityChanges,
} from "@/lib/capacity-form";
import type { ClefAdviceState } from "@/lib/clef-advice";
import { loadClefAdvice } from "@/lib/load-clef-advice";
import { type StaffCancelOutcome, staffCancelFailureOf } from "@/lib/staff-cancel";
import { type StaffPickupOutcome, staffPickupFailureOf } from "@/lib/staff-pickup";

export const cancelReservation = async (code: string): Promise<StaffCancelOutcome> => {
  const parsed = codeSchema.safeParse(code);
  if (!parsed.success) return { status: "failed" };

  try {
    await apiClient.staff.cancel({ code: parsed.data });
  } catch (error) {
    const failed = staffCancelFailureOf(error);

    return failed;
  }
  refresh();
  const cancelled: StaffCancelOutcome = { status: "cancelled" };

  return cancelled;
};

export const saveCapacities = async (
  _previous: CapacityState,
  formData: FormData,
): Promise<CapacityState> => {
  const form = readCapacityChanges(formData);
  if (form.status === "invalid") return form;

  const results = await Promise.all(
    form.changes.map(async (change) => {
      const { productId } = change;
      try {
        await apiClient.staff.setCapacity(change);

        return { productId };
      } catch (error) {
        return { productId, error };
      }
    }),
  );
  const outcome = capacitySaveOutcomeOf(results);
  if (outcome.status !== "signed-out") refresh();

  return outcome;
};

/** Staff take the advisor's suggestion as the product's capacity for the day. */
export const acceptSuggestion = async (suggestion: unknown): Promise<CapacityState> => {
  const parsed = capacityInputSchema.safeParse(suggestion);
  if (!parsed.success) return { status: "failed" };

  const { data: capacity } = parsed;
  const { productId } = capacity;
  const result = await apiClient.staff.setCapacity(capacity).then(
    () => ({ productId }),
    (error: unknown) => ({ productId, error }),
  );
  const outcome = capacitySaveOutcomeOf([result]);
  if (outcome.status !== "signed-out") refresh();

  return outcome;
};

export const askClef = async (pickupDay: unknown): Promise<ClefAdviceState> => {
  const parsed = pickupDaySchema.safeParse(pickupDay);
  if (!parsed.success) return { status: "failed" };

  const advice = await loadClefAdvice(parsed.data);

  return advice;
};

const pickupInputSchema = z.object({ code: codeSchema, pickedUp: z.boolean() });

/** At the counter: the customer took the order, or staff undo a mistaken mark. */
export const markPickedUp = async (pickup: unknown): Promise<StaffPickupOutcome> => {
  const parsed = pickupInputSchema.safeParse(pickup);
  if (!parsed.success) return { status: "failed" };

  try {
    await apiClient.staff.pickup(parsed.data);
  } catch (error) {
    const failed = staffPickupFailureOf(error);

    return failed;
  }
  refresh();
  const marked: StaffPickupOutcome = { status: "marked" };

  return marked;
};
