/** Today's date as YYYY-MM-DD on the bakery's clock; the Worker itself runs in UTC. */
export const todayIn = ({ now, timeZone }: { now: Date; timeZone: string }) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const partOf = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const today = `${partOf("year")}-${partOf("month")}-${partOf("day")}`;

  return today;
};

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** "Thursday 26 November" for a YYYY-MM-DD day. */
export const formatDay = (day: string) => dayFormat.format(new Date(`${day}T00:00:00Z`));

/** "Wednesday 25 November, 18:00" for a bakery wall-clock time such as "2026-11-25T18:00". */
export const formatWallClock = (wallClock: string) => {
  const [day = "", time = ""] = wallClock.split("T");
  const formatted = `${formatDay(day)}, ${time}`;

  return formatted;
};
