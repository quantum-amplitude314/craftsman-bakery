import type { DemandOutlook } from "@craftsman-bakery/contracts";

/** What the bakery knows about one product for a pickup day. */
export type ProductForAdvice = {
  productId: string;
  name: string;
  defaultCapacity: number | null;
  reserved: number;
  recentBakes: { day: string; baked: number }[];
};

export type DayForAdvice = {
  pickupDay: string;
  weekday: string;
  /** On the bakery's clock, like 2026-12-23T13:00. */
  bakeryClockNow: string;
  reservationsCloseAt: string;
  products: ProductForAdvice[];
};

export type ProductDemand = {
  productId: string;
  probabilities: Record<DemandOutlook, number>;
};

/** Judges each product's demand on a day; a decision model behind it, a fake in tests. */
export interface DemandAdvisor {
  adviseOn(day: DayForAdvice): Promise<ProductDemand[]>;
}
