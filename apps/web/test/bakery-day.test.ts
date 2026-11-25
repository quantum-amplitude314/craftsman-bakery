import { describe, expect, test } from "bun:test";
import { tomorrowIn } from "../src/lib/bakery-day.ts";

describe("tomorrowIn", () => {
  test("reads tomorrow on the bakery's clock, not in UTC", () => {
    const lateEvening = new Date("2026-11-25T23:30:00Z");

    expect(tomorrowIn({ now: lateEvening, timeZone: "Europe/Prague" })).toBe("2026-11-27");
  });
});
