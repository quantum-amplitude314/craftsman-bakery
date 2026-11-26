import { ORPCError } from "@orpc/client";

export type StaffPickupOutcome =
  | { status: "marked" }
  | { status: "not-found" }
  | { status: "not-pickup-day" }
  | { status: "signed-out" }
  | { status: "failed" };

const FAILURES_BY_CODE: Record<string, StaffPickupOutcome> = {
  NOT_FOUND: { status: "not-found" },
  NOT_PICKUP_DAY: { status: "not-pickup-day" },
  UNAUTHORIZED: { status: "signed-out" },
};

export const staffPickupFailureOf = (error: unknown): StaffPickupOutcome => {
  const failure = error instanceof ORPCError ? FAILURES_BY_CODE[error.code] : undefined;

  return failure ?? { status: "failed" };
};
