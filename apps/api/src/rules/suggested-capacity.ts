import type { DemandOutlook } from "@craftsman-bakery/contracts";

const DEMAND_FACTOR: Record<DemandOutlook, number> = {
  much_less: 0.7,
  less: 0.85,
  usual: 1,
  more: 1.15,
  much_more: 1.3,
};

/** The default moved by the probability-weighted change in demand, never below what is reserved. */
export const suggestedCapacityOf = ({
  defaultCapacity,
  reserved,
  probabilities,
}: {
  defaultCapacity: number | null;
  reserved: number;
  probabilities: Record<DemandOutlook, number>;
}) => {
  if (defaultCapacity === null) return null;

  const factor = Object.entries(probabilities).reduce(
    (total, [outlook, probability]) =>
      total + probability * DEMAND_FACTOR[outlook as DemandOutlook],
    0,
  );
  const suggested = Math.max(reserved, Math.round(defaultCapacity * factor));

  return suggested;
};
