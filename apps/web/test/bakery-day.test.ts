import { describe, expect, test } from "bun:test";
import { formatWeekday, todayIn } from "../src/lib/bakery-day.ts";

describe("todayIn", () => {
  test("reads today on the bakery's clock, not in UTC", () => {
    const lateEvening = new Date("2026-11-25T23:30:00Z");

    expect(todayIn({ now: lateEvening, timeZone: "Europe/Prague" })).toBe("2026-11-26");
  });
});

describe("formatWeekday", () => {
  test("names the weekday of a calendar day", () => {
    expect(formatWeekday("2026-11-27")).toBe("Friday");
  });
});
