import {
  type CapacityAdvice,
  DEMAND_OUTLOOKS,
  type DemandOutlook,
} from "@craftsman-bakery/contracts";
import { ORPCError } from "@orpc/client";

export type ClefAdviceState =
  | { status: "advised"; products: CapacityAdvice["products"] }
  | { status: "unavailable" }
  | { status: "signed-out" }
  | { status: "failed" };

/** The outlook with the most probability summed over all products; usual without answers. */
export const dayOutlookOf = (products: CapacityAdvice["products"]): DemandOutlook => {
  const totals = DEMAND_OUTLOOKS.map((outlook) => ({
    outlook,
    total: products.reduce((sum, { probabilities }) => sum + probabilities[outlook], 0),
  }));
  const { outlook, total } = totals.reduce((likeliest, candidate) =>
    candidate.total > likeliest.total ? candidate : likeliest,
  );

  return total > 0 ? outlook : "usual";
};

export const clefFailureOf = (error: unknown): ClefAdviceState =>
  error instanceof ORPCError && error.code === "UNAUTHORIZED"
    ? { status: "signed-out" }
    : { status: "failed" };
