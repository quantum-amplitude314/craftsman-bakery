import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import type { DayForAdvice, ProductDemand } from "../src/queries/demand-advisor.ts";
import { createApiTestContext, sendApi } from "./api.ts";
import { createTestDb, resetTables, seedCapacity, seedHistory, seedProduct } from "./helpers.ts";

const { db, close } = createTestDb();
const pickupDay = "2026-12-24";
const certainlyMuchMore = { much_less: 0, less: 0, usual: 0, more: 0, much_more: 1 };

/** Thursdays averaging 100: the default capacity is 30. */
const seedBread = async () => {
  const bread = await seedProduct({ db, name: "Bread" });
  await seedHistory({
    db,
    productId: bread,
    records: [
      { day: "2026-12-17", baked: 110 },
      { day: "2026-12-10", baked: 90 },
      { day: "2026-12-03", baked: 104 },
      { day: "2026-11-26", baked: 96 },
      { day: "2026-11-19", baked: 500 },
      { day: "2026-12-16", baked: 999 },
    ],
  });
  await seedCapacity({ db, productId: bread, pickupDay, limit: 30, reserved: 2 });

  return bread;
};

const askAdvice = ({
  advise,
  isStaff = true,
}: {
  advise: (day: DayForAdvice) => Promise<ProductDemand[]>;
  isStaff?: boolean;
}) =>
  sendApi({
    method: "GET",
    path: `/staff/capacity-advice?pickupDay=${pickupDay}`,
    context: createApiTestContext({ db, isStaff, advise }),
  });

beforeEach(() => resetTables({ db }));
afterAll(() => close());

describe("capacity advice", () => {
  test("gives the advisor the day: recent same-weekday bakes, the default and what is reserved", async () => {
    await seedBread();
    const asked: DayForAdvice[] = [];

    await askAdvice({
      advise: async (day) => {
        asked.push(day);

        return [];
      },
    });

    expect(asked).toEqual([
      {
        pickupDay,
        weekday: "Thursday",
        bakeryClockNow: "2026-12-23T13:00",
        reservationsCloseAt: "2026-12-23T18:00",
        products: [
          {
            productId: expect.any(String),
            name: "Bread",
            defaultCapacity: 30,
            reserved: 2,
            recentBakes: [
              { day: "2026-12-17", baked: 110 },
              { day: "2026-12-10", baked: 90 },
              { day: "2026-12-03", baked: 104 },
              { day: "2026-11-26", baked: 96 },
            ],
          },
        ],
      },
    ]);
  });

  test("turns the advisor's answer into a suggested capacity, with its probabilities", async () => {
    const bread = await seedBread();

    const { status, body } = await askAdvice({
      advise: async () => [{ productId: bread, probabilities: certainlyMuchMore }],
    });

    expect(status).toBe(200);
    expect(body).toEqual({
      pickupDay,
      available: true,
      products: [{ productId: bread, suggested: 39, probabilities: certainlyMuchMore }],
    });
  });

  test("is unavailable when the advisor fails, so the default stays", async () => {
    await seedBread();

    const { status, body } = await askAdvice({
      advise: async () => {
        throw new Error("Clef timed out");
      },
    });

    expect(status).toBe(200);
    expect(body).toEqual({ pickupDay, available: false, products: [] });
  });

  test("answers 401 without a staff session", async () => {
    const { status } = await askAdvice({ advise: async () => [], isStaff: false });

    expect(status).toBe(401);
  });
});
