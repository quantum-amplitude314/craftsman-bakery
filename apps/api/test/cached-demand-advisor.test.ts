import { describe, expect, test } from "bun:test";
import { createCachedDemandAdvisor } from "../src/adapters/cached-demand-advisor.ts";
import type { DayForAdvice, ProductDemand } from "../src/queries/demand-advisor.ts";

const usual = { much_less: 0, less: 0, usual: 1, more: 0, much_more: 0 };

const dayWith = ({ reserved = 2, clock = "2026-12-23T13:00" } = {}): DayForAdvice => ({
  pickupDay: "2026-12-24",
  weekday: "Thursday",
  bakeryClockNow: clock,
  reservationsCloseAt: "2026-12-23T18:00",
  products: [
    {
      productId: "38c49b50-8949-4016-8b17-ce100b321d2b",
      name: "Bread",
      defaultCapacity: 30,
      reserved,
      recentBakes: [{ day: "2026-12-17", baked: 110 }],
    },
  ],
});

const countingAdvisor = ({ fails = false } = {}) => {
  const calls: DayForAdvice[] = [];
  const advisor = {
    adviseOn: async (day: DayForAdvice): Promise<ProductDemand[]> => {
      calls.push(day);
      if (fails) throw new Error("Clef timed out");

      return [{ productId: day.products[0]?.productId ?? "", probabilities: usual }];
    },
  };

  return { advisor, calls };
};

describe("cached demand advisor", () => {
  test("asks once for the same day, whatever the clock says", async () => {
    const { advisor, calls } = countingAdvisor();
    const cached = createCachedDemandAdvisor({ advisor, cache: new Map(), now: () => 0 });

    await cached.adviseOn(dayWith({ clock: "2026-12-23T13:00" }));
    const again = await cached.adviseOn(dayWith({ clock: "2026-12-23T13:05" }));

    expect(calls).toHaveLength(1);
    expect(again).toEqual([
      { productId: "38c49b50-8949-4016-8b17-ce100b321d2b", probabilities: usual },
    ]);
  });

  test("asks again once a reservation changes the day", async () => {
    const { advisor, calls } = countingAdvisor();
    const cached = createCachedDemandAdvisor({ advisor, cache: new Map(), now: () => 0 });

    await cached.adviseOn(dayWith({ reserved: 2 }));
    await cached.adviseOn(dayWith({ reserved: 3 }));

    expect(calls).toHaveLength(2);
  });

  test("asks again after the answer has aged out", async () => {
    const { advisor, calls } = countingAdvisor();
    let time = 0;
    const cached = createCachedDemandAdvisor({ advisor, cache: new Map(), now: () => time });

    await cached.adviseOn(dayWith());
    time += 60 * 60 * 1000;
    await cached.adviseOn(dayWith());

    expect(calls).toHaveLength(2);
  });

  test("keeps no failure, so the next view asks again", async () => {
    const { advisor, calls } = countingAdvisor({ fails: true });
    const cached = createCachedDemandAdvisor({ advisor, cache: new Map(), now: () => 0 });

    await cached.adviseOn(dayWith()).catch(() => null);
    await cached.adviseOn(dayWith()).catch(() => null);

    expect(calls).toHaveLength(2);
  });
});
