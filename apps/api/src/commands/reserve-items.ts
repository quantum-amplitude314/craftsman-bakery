import type { ReservationInput } from "@craftsman-bakery/contracts";
import { fail, succeed } from "../outcome.ts";
import { type CutoffConfig, isReservationClosed } from "../rules/cutoff.ts";
import type { ReservationWriteStore } from "./ports.ts";

const CODE_ATTEMPTS = 5;

export const reserveItems = async ({
  store,
  now,
  cutoff,
  generateCode,
  reservation,
}: {
  store: ReservationWriteStore;
  now: Date;
  cutoff: CutoffConfig;
  generateCode: () => string;
  reservation: ReservationInput;
}) => {
  const { pickupDay } = reservation;
  if (isReservationClosed({ now, pickupDay, cutoff })) return fail("RESERVATIONS_CLOSED");

  for (let attempt = 1; attempt <= CODE_ATTEMPTS; attempt++) {
    const code = generateCode();
    const result = await store.reserveWithinCapacity({ ...reservation, code });
    if (result === "CAPACITY_EXCEEDED") return fail("CAPACITY_EXCEEDED");
    if (result === "RESERVED") return succeed({ code, pickupDay });
  }
  throw new Error(`No free reservation code after ${CODE_ATTEMPTS} attempts`);
};
