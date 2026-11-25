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
  const pickupDay = await store.pickupDayOf({ code });
  if (!pickupDay) return fail("NOT_FOUND");
  const closedForCustomer =
    cancelledBy === "customer" && isReservationClosed({ now, pickupDay, cutoff });
  if (closedForCustomer) return fail("RESERVATIONS_CLOSED");

  const cancelled = await store.cancel({ code });
  if (!cancelled) return fail("NOT_FOUND");

  return succeed({ code });
};
