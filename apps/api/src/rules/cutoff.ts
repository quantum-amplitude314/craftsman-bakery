export type CutoffConfig = { timeZone: string; time: string };

const DAY_MS = 24 * 60 * 60 * 1000;

const dayBefore = (day: string) => {
  const previousDay = new Date(Date.parse(`${day}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);

  return previousDay;
};

/** "2026-07-14T17:59" on the given zone's clock. */
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
  const text = `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;

  return text;
};

/** "2026-07-14T18:00" on the bakery's clock for pickup on 2026-07-15. */
export const closesAtOf = ({ pickupDay, cutoff }: { pickupDay: string; cutoff: CutoffConfig }) =>
  `${dayBefore(pickupDay)}T${cutoff.time}`;

export const isReservationClosed = ({
  now,
  pickupDay,
  cutoff,
}: {
  now: Date;
  pickupDay: string;
  cutoff: CutoffConfig;
}) => {
  const { timeZone } = cutoff;
  const closed = wallClock({ instant: now, timeZone }) >= closesAtOf({ pickupDay, cutoff });

  return closed;
};
