import { describe, expect, test } from "bun:test";
import { isReservationClosed } from "../src/rules/cutoff.ts";

const cutoff = { timeZone: "Europe/Prague", time: "18:00" };
const closedAt = ({ now, pickupDay }: { now: string; pickupDay: string }) =>
  isReservationClosed({ now: new Date(now), pickupDay, cutoff });

describe("cutoff at 18:00 Prague time the day before pickup", () => {
  test("winter, UTC+1", () => {
    expect(closedAt({ now: "2026-01-14T16:59:59Z", pickupDay: "2026-01-15" })).toBe(false);
    expect(closedAt({ now: "2026-01-14T17:00:00Z", pickupDay: "2026-01-15" })).toBe(true);
  });

  test("summer, UTC+2", () => {
    expect(closedAt({ now: "2026-07-14T15:59:59Z", pickupDay: "2026-07-15" })).toBe(false);
    expect(closedAt({ now: "2026-07-14T16:00:00Z", pickupDay: "2026-07-15" })).toBe(true);
  });

  test("the day summer time starts", () => {
    expect(closedAt({ now: "2026-03-29T15:59:59Z", pickupDay: "2026-03-30" })).toBe(false);
    expect(closedAt({ now: "2026-03-29T16:00:00Z", pickupDay: "2026-03-30" })).toBe(true);
  });

  test("across a month and a year end", () => {
    expect(closedAt({ now: "2026-12-31T16:59:59Z", pickupDay: "2027-01-01" })).toBe(false);
    expect(closedAt({ now: "2026-12-31T17:00:00Z", pickupDay: "2027-01-01" })).toBe(true);
  });

  test("a past pickup day is closed", () => {
    expect(closedAt({ now: "2026-07-20T08:00:00Z", pickupDay: "2026-07-15" })).toBe(true);
  });
});
