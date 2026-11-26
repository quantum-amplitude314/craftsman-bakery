import { describe, expect, test } from "bun:test";
import { addDays, weekdayOf } from "../src/calendar-day.ts";

describe("addDays", () => {
  test("moves a day forward and back across month and year ends", () => {
    expect(addDays({ day: "2026-11-30", days: 1 })).toBe("2026-12-01");
    expect(addDays({ day: "2027-01-01", days: -1 })).toBe("2026-12-31");
  });

  test("ignores daylight saving changes on the bakery's clock", () => {
    expect(addDays({ day: "2026-10-25", days: 1 })).toBe("2026-10-26");
  });
});

describe("weekdayOf", () => {
  test("names the weekday of a calendar day", () => {
    expect(weekdayOf("2026-11-27")).toBe("Friday");
  });
});
