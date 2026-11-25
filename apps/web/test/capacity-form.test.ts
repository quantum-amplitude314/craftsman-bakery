import { describe, expect, test } from "bun:test";
import { ORPCError } from "@orpc/client";
import { capacityFailureOf, readCapacityForm } from "../src/lib/capacity-form.ts";

const pickupDay = "2026-11-27";
const productId = "38c49b50-8949-4016-8b17-ce100b321d2b";

const formWith = (capacity: string) => {
  const formData = new FormData();
  formData.set("pickupDay", pickupDay);
  formData.set("productId", productId);
  formData.set("capacity", capacity);

  return formData;
};

describe("readCapacityForm", () => {
  test("reads the day, the product and a whole number", () => {
    expect(readCapacityForm(formWith(" 24 "))).toEqual({
      status: "valid",
      input: { pickupDay, productId, capacity: 24 },
    });
    expect(readCapacityForm(formWith("0"))).toMatchObject({ input: { capacity: 0 } });
  });

  test("rejects an empty, negative, decimal or too large capacity", () => {
    for (const capacity of ["", "-1", "2.5", "1e3", "abc", "10000"])
      expect(readCapacityForm(formWith(capacity))).toEqual({ status: "invalid" });
  });
});

describe("capacityFailureOf", () => {
  test("tells a capacity below what is reserved from an expired session", () => {
    const below = new ORPCError("CAPACITY_BELOW_RESERVED", { defined: true, status: 409 });
    const notFound = new ORPCError("NOT_FOUND", { defined: true, status: 404 });
    const unauthorized = new ORPCError("UNAUTHORIZED", { defined: true, status: 401 });

    expect(capacityFailureOf(below)).toEqual({ status: "below-reserved" });
    expect(capacityFailureOf(notFound)).toEqual({ status: "not-found" });
    expect(capacityFailureOf(unauthorized)).toEqual({ status: "signed-out" });
  });

  test("reports anything else as a failure to retry", () => {
    expect(capacityFailureOf(new Error("network down"))).toEqual({ status: "failed" });
  });
});
