import { asc, eq } from "drizzle-orm";
import type { Db } from "../db/client.ts";
import { availability } from "../db/schema.ts";
import type { ReservationReadStore } from "../queries/ports.ts";

export const createDrizzleReadStore = ({ db }: { db: Db }) => {
  const store: ReservationReadStore = {
    availableOn: ({ pickupDay }) =>
      db
        .select({
          productId: availability.productId,
          name: availability.name,
          available: availability.available,
        })
        .from(availability)
        .where(eq(availability.pickupDay, pickupDay))
        .orderBy(asc(availability.name)),
  };

  return store;
};
