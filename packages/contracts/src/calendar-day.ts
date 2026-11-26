const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD, the format pickup days travel in. */
const calendarDayOf = (instant: Date) => instant.toISOString().slice(0, 10);

/** Unix time has no daylight saving, so a day is always 24 hours. */
export const addDays = ({ day, days }: { day: string; days: number }) =>
  calendarDayOf(new Date(Date.parse(day) + days * DAY_MS));

const weekdayFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long" });

/** "Thursday" for a YYYY-MM-DD day. */
export const weekdayOf = (day: string) => weekdayFormat.format(new Date(day));

/** An instant read on a zone's clock: the calendar day and the time of day. */
export const clockOf = ({ instant, timeZone }: { instant: Date; timeZone: string }) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const partOf = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const clock = {
    day: `${partOf("year")}-${partOf("month")}-${partOf("day")}`,
    time: `${partOf("hour")}:${partOf("minute")}`,
  };

  return clock;
};

/** "2026-07-14T17:59": comparable as text with other wall-clock values. */
export const wallClockOf = (input: { instant: Date; timeZone: string }) => {
  const { day, time } = clockOf(input);

  return `${day}T${time}`;
};
