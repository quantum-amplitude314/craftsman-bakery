import type { PickupList } from "@craftsman-bakery/contracts";
import { and, asc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.ts";
import { capacity, defaultCapacity, product, reservation, reservationItem } from "../db/schema.ts";
import type { ReservationReadStore } from "../queries/ports.ts";

type PickupReservation = PickupList["reservations"][number];

/** Set for the day, else the weekday default; null when the product is not offered. */
const effectiveCapacity = sql`coalesce(${capacity.capacity}, ${defaultCapacity.capacity})`;

const capacityOnDay = (pickupDay: string) =>
  and(eq(capacity.productId, product.id), eq(capacity.pickupDay, pickupDay));

const defaultOnWeekdayOf = (pickupDay: string) =>
  and(
    eq(defaultCapacity.productId, product.id),
    eq(defaultCapacity.weekday, sql`extract(isodow from ${pickupDay}::date)::int`),
  );

export const createDrizzleReadStore = ({ db }: { db: Db }) => {
  const store: ReservationReadStore = {
    availableOn: ({ pickupDay }) =>
      db
        .select({
          productId: product.id,
          name: product.name,
          description: product.description,
          available: sql<number>`${effectiveCapacity} - coalesce(${capacity.reserved}, 0)`.mapWith(
            Number,
          ),
        })
        .from(product)
        .leftJoin(capacity, capacityOnDay(pickupDay))
        .leftJoin(defaultCapacity, defaultOnWeekdayOf(pickupDay))
        .where(sql`${effectiveCapacity} is not null`)
        .orderBy(asc(product.name)),
    capacityOn: ({ pickupDay }) =>
      db
        .select({
          productId: product.id,
          name: product.name,
          capacity: sql<number | null>`${effectiveCapacity}`,
          reserved: sql<number>`coalesce(${capacity.reserved}, 0)`.mapWith(Number),
        })
        .from(product)
        .leftJoin(capacity, capacityOnDay(pickupDay))
        .leftJoin(defaultCapacity, defaultOnWeekdayOf(pickupDay))
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
