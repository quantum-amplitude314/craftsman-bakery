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
