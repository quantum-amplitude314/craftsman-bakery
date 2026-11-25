export type CutoffConfig = { timeZone: string; time: string };

const DAY_MS = 24 * 60 * 60 * 1000;

const dayBefore = (day: string) => {
  const previousDay = new Date(Date.parse(`${day}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);

  return previousDay;
};

/** "2026-07-14 17:59" on the given zone's clock. */
export const wallClock = ({ instant, timeZone }: { instant: Date; timeZone: string }) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value;
  const text = `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}`;

  return text;
};

export const isReservationClosed = ({
  now,
  pickupDay,
  cutoff: { timeZone, time },
}: {
  now: Date;
  pickupDay: string;
  cutoff: CutoffConfig;
}) => {
  const closed = wallClock({ instant: now, timeZone }) >= `${dayBefore(pickupDay)} ${time}`;

  return closed;
};
