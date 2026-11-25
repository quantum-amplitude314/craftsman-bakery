import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createDrizzleWriteStore } from "../src/adapters/drizzle-write-store.ts";
import { cancelReservation } from "../src/commands/cancel-reservation.ts";
import { reserveItems } from "../src/commands/reserve-items.ts";
import {
  codesFrom,
  createTestDb,
  reservedOf,
  resetTables,
  seedCapacity,
  seedProduct,
} from "./helpers.ts";

const { db, close } = createTestDb();
const store = createDrizzleWriteStore({ db });
const cutoff = { timeZone: "Europe/Prague", time: "18:00" };
const pickupDay = "2026-12-24";
const beforeCutoff = new Date("2026-12-23T12:00:00Z");
const afterCutoff = new Date("2026-12-23T17:00:00Z");

const seedReservation = async () => {
  const bread = await seedProduct({ db, name: "Bread" });
  const croissant = await seedProduct({ db, name: "Croissant" });
  await seedCapacity({ db, productId: bread, pickupDay, limit: 5 });
  await seedCapacity({ db, productId: croissant, pickupDay, limit: 5 });
  await reserveItems({
    store,
    now: beforeCutoff,
    cutoff,
    generateCode: codesFrom(["K7M2"]),
    reservation: {
      pickupDay,
      name: "Ada",
      phone: "+420 777 123 456",
      items: [
        { productId: bread, quantity: 2 },
        { productId: croissant, quantity: 3 },
      ],
    },
  });
  const products = { bread, croissant };

  return products;
};

const cancel = ({
  code = "K7M2",
  now = beforeCutoff,
  cancelledBy = "customer",
}: {
  code?: string;
  now?: Date;
  cancelledBy?: "customer" | "staff";
}) => cancelReservation({ store, now, cutoff, code, cancelledBy });

beforeEach(() => resetTables({ db }));
afterAll(() => close());

describe("cancel reservation", () => {
  test("a customer cancels before the cutoff and the capacity is free again", async () => {
    const { bread, croissant } = await seedReservation();

    const outcome = await cancel({});

    expect(outcome).toEqual({ ok: true, value: { code: "K7M2" } });
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(0);
    expect(await reservedOf({ db, productId: croissant, pickupDay })).toBe(0);
    expect(await cancel({})).toEqual({ ok: false, failure: "NOT_FOUND" });
  });

  test("a customer cannot cancel after the cutoff", async () => {
    const { bread } = await seedReservation();

    const outcome = await cancel({ now: afterCutoff });

    expect(outcome).toEqual({ ok: false, failure: "RESERVATIONS_CLOSED" });
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(2);
  });

  test("staff cancel after the cutoff", async () => {
    const { bread } = await seedReservation();

    const outcome = await cancel({ now: afterCutoff, cancelledBy: "staff" });

    expect(outcome).toEqual({ ok: true, value: { code: "K7M2" } });
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(0);
  });

  test("an unknown code is not found", async () => {
    await seedReservation();

    expect(await cancel({ code: "ZZZZ" })).toEqual({ ok: false, failure: "NOT_FOUND" });
  });

  test("concurrent cancels of one reservation free its capacity once", async () => {
    const { bread } = await seedReservation();

    const outcomes = await Promise.all([cancel({}), cancel({})]);

    expect(outcomes.filter(({ ok }) => ok)).toHaveLength(1);
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(0);
  });
});
