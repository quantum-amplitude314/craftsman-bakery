import type { ReservationReadStore } from "./ports.ts";

export const getPickupList = async ({
  store,
  pickupDay,
}: {
  store: ReservationReadStore;
  pickupDay: string;
}) => {
  const reservations = await store.pickupListOn({ pickupDay });
  const pickupList = { pickupDay, reservations };

  return pickupList;
};
