import { clockOf } from "@craftsman-bakery/contracts";
import { fail, succeed } from "../outcome.ts";
import type { ReservationWriteStore } from "./ports.ts";

export const markPickup = async ({
  store,
  now,
  timeZone,
  code,
  pickedUp,
}: {
  store: ReservationWriteStore;
  now: Date;
  timeZone: string;
  code: string;
  pickedUp: boolean;
}) => {
  const state = await store.reservationStateOf({ code });
  if (!state) return fail("NOT_FOUND");
  const { day: today } = clockOf({ instant: now, timeZone });
  if (state.pickupDay !== today) return fail("NOT_PICKUP_DAY");

  const marked = await store.setPickedUp({ code, pickedUpAt: pickedUp ? now : null });
  if (!marked) return fail("NOT_FOUND");

  return succeed({ code });
};
