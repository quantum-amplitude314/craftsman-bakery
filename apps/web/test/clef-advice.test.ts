import { describe, expect, test } from "bun:test";
import { ORPCError } from "@orpc/client";
import { clefFailureOf, dayOutlookOf } from "../src/lib/clef-advice.ts";

describe("clefFailureOf", () => {
  test("an expired session signs out, anything else is a failure to retry", () => {
    const unauthorized = new ORPCError("UNAUTHORIZED", { defined: true, status: 401 });

    expect(clefFailureOf(unauthorized)).toEqual({ status: "signed-out" });
    expect(clefFailureOf(new Error("network down"))).toEqual({ status: "failed" });
  });
});

describe("dayOutlookOf", () => {
  const product = (probabilities: Record<string, number>) => ({
    productId: "38c49b50-8949-4016-8b17-ce100b321d2b",
    suggested: 20,
    probabilities: { much_less: 0, less: 0, usual: 0, more: 0, much_more: 0, ...probabilities },
  });

  test("sums the outlooks of all products into one for the day", () => {
    const products = [
      product({ usual: 0.6, more: 0.4 }),
      product({ more: 0.5, much_more: 0.3, usual: 0.2 }),
    ];

    expect(dayOutlookOf(products)).toBe("more");
  });

  test("calls a day without answers usual", () => {
    expect(dayOutlookOf([])).toBe("usual");
  });
});
