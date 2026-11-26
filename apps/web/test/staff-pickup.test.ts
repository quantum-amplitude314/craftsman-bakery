import { describe, expect, test } from "bun:test";
import { ORPCError } from "@orpc/client";
import { staffPickupFailureOf } from "../src/lib/staff-pickup.ts";

describe("staffPickupFailureOf", () => {
  test("tells a gone reservation, a wrong day and an expired session apart", () => {
    const notFound = new ORPCError("NOT_FOUND", { defined: true, status: 404 });
    const notPickupDay = new ORPCError("NOT_PICKUP_DAY", { defined: true, status: 422 });
    const unauthorized = new ORPCError("UNAUTHORIZED", { defined: true, status: 401 });

    expect(staffPickupFailureOf(notFound)).toEqual({ status: "not-found" });
    expect(staffPickupFailureOf(notPickupDay)).toEqual({ status: "not-pickup-day" });
    expect(staffPickupFailureOf(unauthorized)).toEqual({ status: "signed-out" });
  });

  test("reports anything else as a failure to retry", () => {
    expect(staffPickupFailureOf(new Error("network down"))).toEqual({ status: "failed" });
  });
});
