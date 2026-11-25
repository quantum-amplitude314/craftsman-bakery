import type { ReservationReadStore } from "./ports.ts";

export const getDayCapacity = async ({
  store,
  pickupDay,
}: {
  store: ReservationReadStore;
  pickupDay: string;
}) => {
  const products = await store.capacityOn({ pickupDay });
  const dayCapacity = { pickupDay, products };

  return dayCapacity;
};
