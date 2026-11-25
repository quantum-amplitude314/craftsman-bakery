import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createDrizzleWriteStore } from "../src/adapters/drizzle-write-store.ts";
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

const reserve = ({
  items,
  codes = ["AAAA"],
  now = beforeCutoff,
}: {
  items: { productId: string; quantity: number }[];
  codes?: string[];
  now?: Date;
}) =>
  reserveItems({
    store,
    now,
    cutoff,
    generateCode: codesFrom(codes),
    reservation: { pickupDay, name: "Ada", phone: "+420 777 123 456", items },
  });

const seedBreadAndCroissant = async ({
  breadLimit,
  croissantLimit,
}: {
  breadLimit: number;
  croissantLimit: number;
}) => {
  const bread = await seedProduct({ db, name: "Bread" });
  const croissant = await seedProduct({ db, name: "Croissant" });
  await seedCapacity({ db, productId: bread, pickupDay, limit: breadLimit });
  await seedCapacity({ db, productId: croissant, pickupDay, limit: croissantLimit });
  const products = { bread, croissant };

  return products;
};

beforeEach(() => resetTables({ db }));
afterAll(() => close());

describe("reserve items", () => {
  test("reserves every item and counts it against its capacity", async () => {
    const { bread, croissant } = await seedBreadAndCroissant({ breadLimit: 5, croissantLimit: 10 });

    const outcome = await reserve({
      items: [
        { productId: bread, quantity: 2 },
        { productId: croissant, quantity: 3 },
      ],
    });

    expect(outcome).toEqual({ ok: true, value: { code: "AAAA", pickupDay } });
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(2);
    expect(await reservedOf({ db, productId: croissant, pickupDay })).toBe(3);
  });

  test("reserves nothing when one item exceeds its capacity", async () => {
    const { bread, croissant } = await seedBreadAndCroissant({ breadLimit: 5, croissantLimit: 1 });

    const outcome = await reserve({
      items: [
        { productId: bread, quantity: 2 },
        { productId: croissant, quantity: 2 },
      ],
    });

    expect(outcome).toEqual({ ok: false, failure: "CAPACITY_EXCEEDED" });
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(0);
    expect(await reservedOf({ db, productId: croissant, pickupDay })).toBe(0);
  });

  test("a product without capacity for the pickup day cannot be reserved", async () => {
    const bread = await seedProduct({ db, name: "Bread" });

    const outcome = await reserve({ items: [{ productId: bread, quantity: 1 }] });

    expect(outcome).toEqual({ ok: false, failure: "CAPACITY_EXCEEDED" });
  });

  test("closes at the cutoff", async () => {
    const { bread } = await seedBreadAndCroissant({ breadLimit: 5, croissantLimit: 5 });

    const outcome = await reserve({
      items: [{ productId: bread, quantity: 1 }],
      now: new Date("2026-12-23T17:00:00Z"),
    });

    expect(outcome).toEqual({ ok: false, failure: "RESERVATIONS_CLOSED" });
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(0);
  });

  test("draws another code when the code is taken", async () => {
    const { bread } = await seedBreadAndCroissant({ breadLimit: 5, croissantLimit: 5 });
    await reserve({ items: [{ productId: bread, quantity: 1 }], codes: ["AAAA"] });

    const outcome = await reserve({
      items: [{ productId: bread, quantity: 1 }],
      codes: ["AAAA", "BBBB"],
    });

    expect(outcome).toEqual({ ok: true, value: { code: "BBBB", pickupDay } });
  });

  test("concurrent reservations for the last item have exactly one winner", async () => {
    const { bread } = await seedBreadAndCroissant({ breadLimit: 1, croissantLimit: 1 });

    const outcomes = await Promise.all(
      ["AAAA", "BBBB"].map((code) =>
        reserve({ items: [{ productId: bread, quantity: 1 }], codes: [code] }),
      ),
    );

    expect(outcomes.filter(({ ok }) => ok)).toHaveLength(1);
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(1);
  });

  test("concurrent reservations listing products in opposite order all succeed", async () => {
    const { bread, croissant } = await seedBreadAndCroissant({
      breadLimit: 100,
      croissantLimit: 100,
    });
    const codes = ["AAAA", "BBBB", "CCCC", "DDDD", "EEEE", "FFFF", "GGGG", "HHHH"];

    const outcomes = await Promise.all(
      codes.map((code, index) => {
        const items = [
          { productId: bread, quantity: 1 },
          { productId: croissant, quantity: 1 },
        ];

        return reserve({ items: index % 2 ? items.toReversed() : items, codes: [code] });
      }),
    );

    expect(outcomes.every(({ ok }) => ok)).toBe(true);
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(codes.length);
  });
});
