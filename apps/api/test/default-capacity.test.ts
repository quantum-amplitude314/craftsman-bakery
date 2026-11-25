import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createApiTestContext, sendApi } from "./api.ts";
import {
  createTestDb,
  reservedOf,
  resetTables,
  seedCapacity,
  seedHistory,
  seedProduct,
} from "./helpers.ts";

const { db, close } = createTestDb();
const customer = createApiTestContext({ db, now: "2026-12-20T12:00:00Z" });
const monday = "2026-12-28";
const saturday = "2026-12-26";

/** The last 4 Mondays average 100; the older one is left out. Saturdays average 50. */
const seedBreadWithHistory = async () => {
  const bread = await seedProduct({ db, name: "Bread" });
  await seedHistory({
    db,
    productId: bread,
    records: [
      { day: "2026-12-21", baked: 110 },
      { day: "2026-12-14", baked: 90 },
      { day: "2026-12-07", baked: 104 },
      { day: "2026-11-30", baked: 96 },
      { day: "2026-11-23", baked: 500 },
      { day: "2026-12-19", baked: 50 },
      { day: "2026-12-12", baked: 50 },
    ],
  });

  return bread;
};

const availableOn = async ({ pickupDay }: { pickupDay: string }) => {
  const { body } = await sendApi({
    method: "GET",
    path: `/availability?pickupDay=${pickupDay}`,
    context: customer,
  });
  const { products } = body as { products: { name: string; available: number }[] };

  return products.map(({ name, available }) => ({ name, available }));
};

const reserve = ({
  productId,
  quantity,
  code,
}: {
  productId: string;
  quantity: number;
  code: string;
}) =>
  sendApi({
    method: "POST",
    path: "/reservations",
    body: {
      pickupDay: monday,
      name: "Ada",
      phone: "+420 777 123 456",
      items: [{ productId, quantity }],
      turnstileToken: "token",
    },
    context: createApiTestContext({ db, now: "2026-12-20T12:00:00Z", codes: [code] }),
  });

beforeEach(() => resetTables({ db }));
afterAll(() => close());

describe("default capacity", () => {
  test("is 30% of the average of the last 4 same weekdays", async () => {
    await seedBreadWithHistory();

    expect(await availableOn({ pickupDay: monday })).toEqual([{ name: "Bread", available: 30 }]);
    expect(await availableOn({ pickupDay: saturday })).toEqual([{ name: "Bread", available: 15 }]);
  });

  test("a capacity set for the day overrides it", async () => {
    const bread = await seedBreadWithHistory();
    await seedCapacity({ db, productId: bread, pickupDay: monday, limit: 5 });

    expect(await availableOn({ pickupDay: monday })).toEqual([{ name: "Bread", available: 5 }]);
  });

  test("reservations count against it, and it is a limit", async () => {
    const bread = await seedBreadWithHistory();

    const reserved = await reserve({ productId: bread, quantity: 10, code: "AAAA" });
    const tooMany = await reserve({ productId: bread, quantity: 21, code: "BBBB" });

    expect([reserved.status, tooMany.status]).toEqual([201, 409]);
    expect(await reservedOf({ db, productId: bread, pickupDay: monday })).toBe(10);
    expect(await availableOn({ pickupDay: monday })).toEqual([{ name: "Bread", available: 20 }]);
  });

  test("a product without history or capacity is not offered", async () => {
    await seedProduct({ db, name: "Bread" });

    expect(await availableOn({ pickupDay: monday })).toEqual([]);
  });
});
