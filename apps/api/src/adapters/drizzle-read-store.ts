import type { PickupList } from "@acme-bakery/contracts";
import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.ts";
import { availability, product, reservation, reservationItem } from "../db/schema.ts";
import type { ReservationReadStore } from "../queries/ports.ts";

type PickupReservation = PickupList["reservations"][number];

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
    bakeCountOn: ({ pickupDay }) =>
      db
        .select({
          productId: product.id,
          name: product.name,
          quantity: sql<number>`sum(${reservationItem.quantity})`.mapWith(Number),
        })
        .from(reservationItem)
        .innerJoin(reservation, eq(reservation.code, reservationItem.reservationCode))
        .innerJoin(product, eq(product.id, reservationItem.productId))
        .where(eq(reservation.pickupDay, pickupDay))
        .groupBy(product.id, product.name)
        .orderBy(asc(product.name)),
    pickupListOn: async ({ pickupDay }) => {
      const rows = await db
        .select({
          code: reservation.code,
          name: reservation.name,
          phone: reservation.phone,
          productId: product.id,
          productName: product.name,
          quantity: reservationItem.quantity,
        })
        .from(reservation)
        .innerJoin(reservationItem, eq(reservationItem.reservationCode, reservation.code))
        .innerJoin(product, eq(product.id, reservationItem.productId))
        .where(eq(reservation.pickupDay, pickupDay))
        .orderBy(asc(reservation.name), asc(reservation.code), asc(product.name));
      const byCode = new Map<string, PickupReservation>();
      for (const { code, name, phone, productId, productName, quantity } of rows) {
        const pickup = byCode.get(code) ?? { code, name, phone, items: [] };
        pickup.items.push({ productId, name: productName, quantity });
        byCode.set(code, pickup);
      }

      return [...byCode.values()];
    },
  };

  return store;
};
