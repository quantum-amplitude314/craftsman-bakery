import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createDrizzleWriteStore } from "../src/adapters/drizzle-write-store.ts";
import { reserveItems } from "../src/commands/reserve-items.ts";
import { createApiTestContext, sendApi } from "./api.ts";
import {
  codesFrom,
  createTestDb,
  resetTables,
  seedCapacity,
  seedHistory,
  seedProduct,
} from "./helpers.ts";

const { db, close } = createTestDb();
const store = createDrizzleWriteStore({ db });
const pickupDay = "2026-12-24";
const otherDay = "2026-12-25";
const staff = createApiTestContext({ db, isStaff: true });

const reserve = ({
  code,
  name,
  day = pickupDay,
  items,
}: {
  code: string;
  name: string;
  day?: string;
  items: { productId: string; quantity: number }[];
}) =>
  reserveItems({
    store,
    now: new Date("2026-12-20T12:00:00Z"),
    cutoff: { timeZone: "Europe/Prague", time: "18:00" },
    generateCode: codesFrom([code]),
    reservation: { pickupDay: day, name, phone: "+420 777 123 456", items },
  });

const seedDay = async () => {
  const bread = await seedProduct({ db, name: "Bread" });
  const croissant = await seedProduct({ db, name: "Croissant" });
  const baguette = await seedProduct({ db, name: "Baguette" });
  for (const day of [pickupDay, otherDay])
    for (const productId of [bread, croissant, baguette])
      await seedCapacity({ db, productId, pickupDay: day, limit: 20 });
  await reserve({ code: "BBBB", name: "Bob", items: [{ productId: bread, quantity: 2 }] });
  await reserve({
    code: "AAAA",
    name: "Ada",
    items: [
      { productId: croissant, quantity: 3 },
      { productId: bread, quantity: 1 },
    ],
  });
  await reserve({
    code: "CCCC",
    name: "Cy",
    day: otherDay,
    items: [{ productId: baguette, quantity: 5 }],
  });
  const products = { bread, croissant, baguette };

  return products;
};

beforeEach(() => resetTables({ db }));
afterAll(() => close());

describe("staff queries", () => {
  test("the bake count sums the day's reservations per product", async () => {
    const { bread, croissant } = await seedDay();

    const { status, body } = await sendApi({
      method: "GET",
      path: `/staff/bake-count?pickupDay=${pickupDay}`,
      context: staff,
    });

    expect(status).toBe(200);
    expect(body).toEqual({
      pickupDay,
      products: [
        { productId: bread, name: "Bread", quantity: 3 },
        { productId: croissant, name: "Croissant", quantity: 3 },
      ],
    });
  });

  test("the pickup list shows the day's reservations by name, with their items", async () => {
    const { bread, croissant } = await seedDay();

    const { status, body } = await sendApi({
      method: "GET",
      path: `/staff/pickup-list?pickupDay=${pickupDay}`,
      context: staff,
    });

    expect(status).toBe(200);
    expect(body).toEqual({
      pickupDay,
      reservations: [
        {
          code: "AAAA",
          name: "Ada",
          phone: "+420 777 123 456",
          items: [
            { productId: bread, name: "Bread", quantity: 1 },
            { productId: croissant, name: "Croissant", quantity: 3 },
          ],
        },
        {
          code: "BBBB",
          name: "Bob",
          phone: "+420 777 123 456",
          items: [{ productId: bread, name: "Bread", quantity: 2 }],
        },
      ],
    });
  });

  test("the capacity lists every product: set for the day, the default, or not offered", async () => {
    const bread = await seedProduct({ db, name: "Bread" });
    await seedCapacity({ db, productId: bread, pickupDay, limit: 20, reserved: 3 });
    const croissant = await seedProduct({ db, name: "Croissant" });
    await seedHistory({
      db,
      productId: croissant,
      records: [
        { day: "2026-12-17", baked: 40 },
        { day: "2026-12-10", baked: 40 },
      ],
    });
    const rye = await seedProduct({ db, name: "Rye" });

    const { status, body } = await sendApi({
      method: "GET",
      path: `/staff/capacity?pickupDay=${pickupDay}`,
      context: staff,
    });

    expect(status).toBe(200);
    expect(body).toEqual({
      pickupDay,
      products: [
        { productId: bread, name: "Bread", capacity: 20, reserved: 3 },
        { productId: croissant, name: "Croissant", capacity: 12, reserved: 0 },
        { productId: rye, name: "Rye", capacity: null, reserved: 0 },
      ],
    });
  });

  test("all answer 401 without a staff session", async () => {
    const visitor = createApiTestContext({ db });

    const statuses = await Promise.all(
      ["bake-count", "pickup-list", "capacity"].map(async (path) => {
        const { status } = await sendApi({
          method: "GET",
          path: `/staff/${path}?pickupDay=${pickupDay}`,
          context: visitor,
        });

        return status;
      }),
    );

    expect(statuses).toEqual([401, 401, 401]);
  });
});
