import { type CutoffConfig, closesAtOf } from "../rules/cutoff.ts";
import type { ReservationReadStore } from "./ports.ts";

export const getAvailability = async ({
  store,
  cutoff,
  pickupDay,
}: {
  store: ReservationReadStore;
  cutoff: CutoffConfig;
  pickupDay: string;
}) => {
  const products = await store.availableOn({ pickupDay });
  const availability = { pickupDay, closesAt: closesAtOf({ pickupDay, cutoff }), products };

  return availability;
};
