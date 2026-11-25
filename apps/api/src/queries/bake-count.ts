import type { ReservationReadStore } from "./ports.ts";

export const getBakeCount = async ({
  store,
  pickupDay,
}: {
  store: ReservationReadStore;
  pickupDay: string;
}) => {
  const products = await store.bakeCountOn({ pickupDay });
  const bakeCount = { pickupDay, products };

  return bakeCount;
};
