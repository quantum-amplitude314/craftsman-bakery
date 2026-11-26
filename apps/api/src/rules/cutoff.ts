import { addDays, clockOf, wallClockOf } from "@craftsman-bakery/contracts";

export type CutoffConfig = { timeZone: string; time: string };

/** "2026-07-14T18:00" on the bakery's clock for pickup on 2026-07-15. */
export const closesAtOf = ({ pickupDay, cutoff }: { pickupDay: string; cutoff: CutoffConfig }) =>
  `${addDays({ day: pickupDay, days: -1 })}T${cutoff.time}`;

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
  const closed = wallClockOf({ instant: now, timeZone }) >= closesAtOf({ pickupDay, cutoff });

  return closed;
};

/** Tomorrow on the bakery's clock until its cutoff, then the day after. */
export const nextOpenPickupDay = ({ now, cutoff }: { now: Date; cutoff: CutoffConfig }) => {
  const { timeZone } = cutoff;
  const { day: today } = clockOf({ instant: now, timeZone });
  const tomorrow = addDays({ day: today, days: 1 });
  const pickupDay = isReservationClosed({ now, pickupDay: tomorrow, cutoff })
    ? addDays({ day: tomorrow, days: 1 })
    : tomorrow;

  return pickupDay;
};
