"use server";

import { apiClient } from "@/lib/api";
import { type CancelState, cancelFailureOf, readCancelForm } from "@/lib/cancel-form";

export const cancel = async (previous: CancelState, formData: FormData): Promise<CancelState> => {
  const form = readCancelForm(formData);
  if (form.status === "invalid") {
    const invalid: CancelState = { ...form, attempt: previous.attempt };

    return invalid;
  }

  const attempt = previous.attempt + 1;

  const { input } = form;
  try {
    await apiClient.customer.cancel(input);
    const cancelled: CancelState = { status: "cancelled", code: input.code, attempt };

    return cancelled;
  } catch (error) {
    const failed: CancelState = { ...cancelFailureOf(error), attempt };

    return failed;
  }
};
