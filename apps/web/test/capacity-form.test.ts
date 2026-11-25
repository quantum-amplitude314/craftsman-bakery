import { describe, expect, test } from "bun:test";
import { ORPCError } from "@orpc/client";
import {
  capacityFieldOf,
  capacitySaveOutcomeOf,
  readCapacityChanges,
} from "../src/lib/capacity-form.ts";

const pickupDay = "2026-11-27";
const BREAD = "38c49b50-8949-4016-8b17-ce100b321d2b";
const RYE = "0eb76376-4e1b-4820-834b-c95c8fb64333";

const formWith = (capacities: Record<string, string>) => {
  const formData = new FormData();
  formData.set("pickupDay", pickupDay);
  for (const [productId, capacity] of Object.entries(capacities))
    formData.set(capacityFieldOf(productId), capacity);

  return formData;
};

describe("readCapacityChanges", () => {
  test("reads each changed capacity for the day as a whole number", () => {
    expect(readCapacityChanges(formWith({ [BREAD]: " 24 ", [RYE]: "0" }))).toEqual({
      status: "valid",
      changes: [
        { pickupDay, productId: BREAD, capacity: 24 },
        { pickupDay, productId: RYE, capacity: 0 },
      ],
    });
  });

  test("names the products whose capacity is empty, negative, decimal or too large", () => {
    for (const capacity of ["", "-1", "2.5", "1e3", "abc", "10000"])
      expect(readCapacityChanges(formWith({ [BREAD]: "24", [RYE]: capacity }))).toEqual({
        status: "invalid",
        productIds: [RYE],
      });
  });
});

describe("capacitySaveOutcomeOf", () => {
  const belowReserved = new ORPCError("CAPACITY_BELOW_RESERVED", { defined: true, status: 409 });

  test("saved when every change went through", () => {
    expect(capacitySaveOutcomeOf([{ productId: BREAD }, { productId: RYE }])).toEqual({
      status: "saved",
    });
  });

  test("names the products refused for going below what is reserved", () => {
    const outcome = capacitySaveOutcomeOf([
      { productId: BREAD },
      { productId: RYE, error: belowReserved },
    ]);

    expect(outcome).toEqual({ status: "below-reserved", productIds: [RYE] });
  });

  test("an expired session signs out, any other error is a failure to retry", () => {
    const unauthorized = new ORPCError("UNAUTHORIZED", { defined: true, status: 401 });

    expect(capacitySaveOutcomeOf([{ productId: BREAD, error: unauthorized }])).toEqual({
      status: "signed-out",
    });
    expect(
      capacitySaveOutcomeOf([
        { productId: BREAD, error: new Error("network down") },
        { productId: RYE, error: belowReserved },
      ]),
    ).toEqual({ status: "failed" });
  });
});
