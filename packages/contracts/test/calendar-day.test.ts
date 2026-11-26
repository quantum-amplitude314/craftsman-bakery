import { describe, expect, test } from "bun:test";
import { addDays, clockOf, wallClockOf, weekdayOf } from "../src/calendar-day.ts";

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

describe("clockOf", () => {
  const timeZone = "Europe/Prague";

  test("reads the day and the time on the zone's clock, not in UTC", () => {
    expect(clockOf({ instant: new Date("2026-11-25T23:30:00Z"), timeZone })).toEqual({
      day: "2026-11-26",
      time: "00:30",
    });
  });

  test("follows summer time", () => {
    expect(clockOf({ instant: new Date("2026-07-14T16:00:00Z"), timeZone })).toEqual({
      day: "2026-07-14",
      time: "18:00",
    });
  });

  test("writes both as one wall-clock value", () => {
    expect(wallClockOf({ instant: new Date("2026-07-14T15:59:00Z"), timeZone })).toBe(
      "2026-07-14T17:59",
    );
  });
});
