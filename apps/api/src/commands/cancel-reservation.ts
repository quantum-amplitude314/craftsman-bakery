import { fail, succeed } from "../outcome.ts";
import { type CutoffConfig, isReservationClosed } from "../rules/cutoff.ts";
import type { ReservationWriteStore } from "./ports.ts";

export const cancelReservation = async ({
  store,
  now,
  cutoff,
  code,
  cancelledBy,
}: {
  store: ReservationWriteStore;
  now: Date;
  cutoff: CutoffConfig;
  code: string;
  cancelledBy: "customer" | "staff";
}) => {
  const state = await store.reservationStateOf({ code });
  if (!state) return fail("NOT_FOUND");
  const { pickupDay, pickedUp } = state;
  const closedForCustomer =
    cancelledBy === "customer" && isReservationClosed({ now, pickupDay, cutoff });
  if (closedForCustomer) return fail("RESERVATIONS_CLOSED");
  if (pickedUp) return fail("PICKED_UP");

  const cancelled = await store.cancel({ code });
  if (!cancelled) return fail("NOT_FOUND");

  return succeed({ code });
};
