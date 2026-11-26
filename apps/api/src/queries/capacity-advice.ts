import { weekdayOf } from "@craftsman-bakery/contracts";
import { type CutoffConfig, closesAtOf, wallClock } from "../rules/cutoff.ts";
import { suggestedCapacityOf } from "../rules/suggested-capacity.ts";
import type { DemandAdvisor } from "./demand-advisor.ts";
import type { ReservationReadStore } from "./ports.ts";

/** As many as the default capacity averages. */
const RECENT_BAKES = 4;

export const getCapacityAdvice = async ({
  store,
  advisor,
  pickupDay,
  cutoff,
  now,
}: {
  store: ReservationReadStore;
  advisor: DemandAdvisor;
  pickupDay: string;
  cutoff: CutoffConfig;
  now: Date;
}) => {
  const { timeZone } = cutoff;
  const products = await store.adviceInputsOn({ pickupDay, recentBakes: RECENT_BAKES });
  const day = {
    pickupDay,
    weekday: weekdayOf(pickupDay),
    bakeryClockNow: wallClock({ instant: now, timeZone }),
    reservationsCloseAt: closesAtOf({ pickupDay, cutoff }),
    products,
  };
  try {
    const demands = await advisor.adviseOn(day);
    const advised = products.flatMap(({ productId, defaultCapacity, reserved }) => {
      const demand = demands.find((candidate) => candidate.productId === productId);
      if (!demand) return [];
      const { probabilities } = demand;

      return [
        {
          productId,
          suggested: suggestedCapacityOf({ defaultCapacity, reserved, probabilities }),
          probabilities,
        },
      ];
    });
    const advice = { pickupDay, available: true, products: advised };

    return advice;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ message: "advisor_error", pickupDay, detail }));
    const unavailable = { pickupDay, available: false, products: [] };

    return unavailable;
  }
};
