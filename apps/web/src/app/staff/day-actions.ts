"use server";

import { codeSchema } from "@craftsman-bakery/contracts";
import { refresh } from "next/cache";
import { apiClient } from "@/lib/api";
import {
  type CapacityState,
  capacitySaveOutcomeOf,
  readCapacityChanges,
} from "@/lib/capacity-form";
import { type StaffCancelOutcome, staffCancelFailureOf } from "@/lib/staff-cancel";

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
