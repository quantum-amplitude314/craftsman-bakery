import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createDrizzleReadStore } from "../src/adapters/drizzle-read-store.ts";
import { getAvailability } from "../src/queries/availability.ts";
import { createTestDb, resetTables, seedCapacity, seedProduct } from "./helpers.ts";

const { db, close } = createTestDb();
const store = createDrizzleReadStore({ db });
const cutoff = { timeZone: "Europe/Prague", time: "18:00" };
const pickupDay = "2026-12-24";

beforeEach(() => resetTables({ db }));
afterAll(() => close());

describe("availability", () => {
  test("lists what is left of each product offered that day, by name", async () => {
    const rye = await seedProduct({ db, name: "Rye bread" });
    const croissant = await seedProduct({ db, name: "Croissant" });
    await seedCapacity({ db, productId: rye, pickupDay, limit: 5, reserved: 2 });
    await seedCapacity({ db, productId: croissant, pickupDay, limit: 3, reserved: 3 });

    const availability = await getAvailability({ store, cutoff, pickupDay });

    expect(availability.products).toEqual([
      { productId: croissant, name: "Croissant", available: 0 },
      { productId: rye, name: "Rye bread", available: 3 },
    ]);
  });

  test("leaves out products without capacity that day", async () => {
    const rye = await seedProduct({ db, name: "Rye bread" });
    await seedProduct({ db, name: "Croissant" });
    await seedCapacity({ db, productId: rye, pickupDay: "2026-12-23", limit: 5 });

    const availability = await getAvailability({ store, cutoff, pickupDay });

    expect(availability.products).toEqual([]);
  });

  test("closes at the cutoff on the bakery's clock", async () => {
    const availability = await getAvailability({ store, cutoff, pickupDay });

    expect(availability).toMatchObject({ pickupDay, closesAt: "2026-12-23T18:00" });
  });
});
