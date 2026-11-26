import { and, asc, eq, sql } from "drizzle-orm";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { DatabaseError } from "pg";
import type { ReservationWriteStore, ReserveResult } from "../commands/ports.ts";
import type { Db } from "../db/client.ts";
import { capacity, defaultCapacity, reservation, reservationItem } from "../db/schema.ts";

class ReservationRejected extends Error {
  readonly result: Exclude<ReserveResult, "RESERVED">;

  constructor(result: Exclude<ReserveResult, "RESERVED">) {
    super(result);
    this.result = result;
  }
}

const FOREIGN_KEY_VIOLATION = "23503";

/** Drizzle wraps the driver's error; the `pg` error with the SQLSTATE code is its cause. */
const isForeignKeyViolation = (error: unknown) =>
  error instanceof DrizzleQueryError &&
  error.cause instanceof DatabaseError &&
  error.cause.code === FOREIGN_KEY_VIOLATION;

export const createDrizzleWriteStore = ({ db }: { db: Db }) => {
  const store: ReservationWriteStore = {
    reserveWithinCapacity: async ({ code, pickupDay, name, phone, items }) => {
      try {
        await db.transaction(async (tx) => {
          const inserted = await tx
            .insert(reservation)
            .values({ code, pickupDay, name, phone })
            .onConflictDoNothing()
            .returning({ code: reservation.code });
          if (inserted.length === 0) throw new ReservationRejected("CODE_TAKEN");

          const itemsInLockOrder = items.toSorted((first, second) =>
            first.productId.localeCompare(second.productId),
          );
          for (const { productId, quantity } of itemsInLockOrder) {
            // A day nobody set takes its default as its capacity row on the first reservation.
            await tx
              .insert(capacity)
              .select(
                tx
                  .select({
                    productId: defaultCapacity.productId,
                    pickupDay: sql`${pickupDay}::date`.as("pickup_day"),
                    capacity: defaultCapacity.capacity,
                    reserved: sql`0`.as("reserved"),
                  })
                  .from(defaultCapacity)
                  .where(
                    and(
                      eq(defaultCapacity.productId, productId),
                      eq(
                        defaultCapacity.weekday,
                        sql`extract(isodow from ${pickupDay}::date)::int`,
                      ),
                    ),
                  ),
              )
              .onConflictDoNothing();
            const counted = await tx
              .update(capacity)
              .set({ reserved: sql`${capacity.reserved} + ${quantity}` })
              .where(
                and(
                  eq(capacity.productId, productId),
                  eq(capacity.pickupDay, pickupDay),
                  sql`${capacity.reserved} + ${quantity} <= ${capacity.capacity}`,
                ),
              )
              .returning({ productId: capacity.productId });
            if (counted.length === 0) throw new ReservationRejected("CAPACITY_EXCEEDED");
          }

          await tx.insert(reservationItem).values(
            items.map(({ productId, quantity }) => ({
              reservationCode: code,
              productId,
              quantity,
            })),
          );
        });
      } catch (error) {
        if (error instanceof ReservationRejected) return error.result;
        throw error;
      }

      return "RESERVED";
    },
    reservationStateOf: async ({ code }) => {
      const [found] = await db
        .select({ pickupDay: reservation.pickupDay, pickedUpAt: reservation.pickedUpAt })
        .from(reservation)
        .where(eq(reservation.code, code));
      if (!found) return null;

      const { pickupDay, pickedUpAt } = found;
      const state = { pickupDay, pickedUp: pickedUpAt !== null };

      return state;
    },
    setPickedUp: async ({ code, pickedUpAt }) => {
      const updated = await db
        .update(reservation)
        .set({ pickedUpAt })
        .where(eq(reservation.code, code))
        .returning({ code: reservation.code });

      return updated.length > 0;
    },
    cancel: ({ code }) =>
      db.transaction(async (tx) => {
        const items = await tx
          .select({ productId: reservationItem.productId, quantity: reservationItem.quantity })
          .from(reservationItem)
          .where(eq(reservationItem.reservationCode, code))
          .orderBy(asc(reservationItem.productId));
        const [deleted] = await tx
          .delete(reservation)
          .where(eq(reservation.code, code))
          .returning({ pickupDay: reservation.pickupDay });
        if (!deleted) return false;

        for (const { productId, quantity } of items) {
          await tx
            .update(capacity)
            .set({ reserved: sql`${capacity.reserved} - ${quantity}` })
            .where(
              and(eq(capacity.productId, productId), eq(capacity.pickupDay, deleted.pickupDay)),
            );
        }

        return true;
      }),
    setCapacity: async ({ productId, pickupDay, capacity: limit }) => {
      try {
        const written = await db
          .insert(capacity)
          .values({ productId, pickupDay, capacity: limit })
          .onConflictDoUpdate({
            target: [capacity.productId, capacity.pickupDay],
            set: { capacity: limit },
            setWhere: sql`${capacity.reserved} <= ${limit}`,
          })
          .returning({ productId: capacity.productId });

        return written.length === 0 ? "BELOW_RESERVED" : "SET";
      } catch (error) {
        if (isForeignKeyViolation(error)) return "UNKNOWN_PRODUCT";
        throw error;
      }
    },
  };

  return store;
};
