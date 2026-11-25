const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD, the format pickup days travel in. */
const calendarDayOf = (instant: Date) => instant.toISOString().slice(0, 10);

/** Unix time has no daylight saving, so a day is always 24 hours. */
export const addDays = ({ day, days }: { day: string; days: number }) =>
  calendarDayOf(new Date(Date.parse(day) + days * DAY_MS));
