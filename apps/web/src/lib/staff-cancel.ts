import { ORPCError } from "@orpc/client";

export type StaffCancelOutcome =
  | { status: "cancelled" }
  | { status: "not-found" }
  | { status: "picked-up" }
  | { status: "signed-out" }
  | { status: "failed" };

const FAILURES_BY_CODE: Record<string, StaffCancelOutcome> = {
  NOT_FOUND: { status: "not-found" },
  PICKED_UP: { status: "picked-up" },
  UNAUTHORIZED: { status: "signed-out" },
};

export const staffCancelFailureOf = (error: unknown): StaffCancelOutcome => {
  const failure = error instanceof ORPCError ? FAILURES_BY_CODE[error.code] : undefined;

  return failure ?? { status: "failed" };
};
