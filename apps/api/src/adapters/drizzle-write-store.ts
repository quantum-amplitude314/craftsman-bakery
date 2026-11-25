import { and, asc, eq, sql } from "drizzle-orm";
import type { ReservationWriteStore, ReserveResult } from "../commands/ports.ts";
import type { Db } from "../db/client.ts";
import { capacity, reservation, reservationItem } from "../db/schema.ts";

class ReservationRejected extends Error {
  readonly result: Exclude<ReserveResult, "RESERVED">;

  constructor(result: Exclude<ReserveResult, "RESERVED">) {
    super(result);
    this.result = result;
  }
}

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
    pickupDayOf: async ({ code }) => {
      const [found] = await db
        .select({ pickupDay: reservation.pickupDay })
        .from(reservation)
        .where(eq(reservation.code, code));

      return found?.pickupDay ?? null;
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
  };

  return store;
};
