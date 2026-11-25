"use server";

import { apiClient } from "@/lib/api";
import { type ReserveState, readReservationForm, reserveFailureOf } from "@/lib/reservation-form";

export const reserve = async (
  previous: ReserveState,
  formData: FormData,
): Promise<ReserveState> => {
  const attempt = previous.attempt + 1;
  const form = readReservationForm(formData);
  if (form.status === "invalid") {
    const invalid: ReserveState = { ...form, attempt };

    return invalid;
  }

  const { input } = form;
  try {
    const receipt = await apiClient.customer.reserve(input);
    const reserved: ReserveState = { status: "reserved", receipt, attempt };

    return reserved;
  } catch (error) {
    const failed: ReserveState = { ...reserveFailureOf({ error, items: input.items }), attempt };

    return failed;
  }
};
