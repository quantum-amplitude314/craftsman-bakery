import { apiClient } from "@/lib/api";
import { type ClefAdviceState, clefFailureOf } from "@/lib/clef-advice";

/** One model call per load. */
export const loadClefAdvice = async (pickupDay: string): Promise<ClefAdviceState> => {
  try {
    const { available, products } = await apiClient.staff.capacityAdvice({ pickupDay });
    const advice: ClefAdviceState = available
      ? { status: "advised", products }
      : { status: "unavailable" };

    return advice;
  } catch (error) {
    const failed = clefFailureOf(error);

    return failed;
  }
};
