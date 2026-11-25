"use server";

import { codeSchema } from "@craftsman-bakery/contracts";
import { refresh } from "next/cache";
import { apiClient } from "@/lib/api";
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
