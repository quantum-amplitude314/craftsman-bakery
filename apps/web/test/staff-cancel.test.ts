import { describe, expect, test } from "bun:test";
import { ORPCError } from "@orpc/client";
import { staffCancelFailureOf } from "../src/lib/staff-cancel.ts";

describe("staffCancelFailureOf", () => {
  test("tells an already cancelled reservation from an expired session", () => {
    const notFound = new ORPCError("NOT_FOUND", { defined: true, status: 404 });
    const unauthorized = new ORPCError("UNAUTHORIZED", { defined: true, status: 401 });

    expect(staffCancelFailureOf(notFound)).toEqual({ status: "not-found" });
    expect(staffCancelFailureOf(unauthorized)).toEqual({ status: "signed-out" });
  });

  test("reports anything else as a failure to retry", () => {
    expect(staffCancelFailureOf(new Error("network down"))).toEqual({ status: "failed" });
  });
});
