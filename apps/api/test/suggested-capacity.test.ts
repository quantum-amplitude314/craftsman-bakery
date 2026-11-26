import { describe, expect, test } from "bun:test";
import { suggestedCapacityOf } from "../src/rules/suggested-capacity.ts";

const certain = (outlook: string) => ({
  much_less: 0,
  less: 0,
  usual: 0,
  more: 0,
  much_more: 0,
  [outlook]: 1,
});

describe("suggestedCapacityOf", () => {
  test("keeps the default when demand looks usual", () => {
    expect(
      suggestedCapacityOf({ defaultCapacity: 20, reserved: 0, probabilities: certain("usual") }),
    ).toBe(20);
  });

  test("moves the default by the likely change in demand", () => {
    expect(
      suggestedCapacityOf({
        defaultCapacity: 20,
        reserved: 0,
        probabilities: certain("much_more"),
      }),
    ).toBe(26);
    expect(
      suggestedCapacityOf({ defaultCapacity: 20, reserved: 0, probabilities: certain("less") }),
    ).toBe(17);
  });

  test("weighs the outlooks by their probability, so a split answer stays near the default", () => {
    const split = { much_less: 0, less: 0.5, usual: 0, more: 0.5, much_more: 0 };

    expect(suggestedCapacityOf({ defaultCapacity: 20, reserved: 0, probabilities: split })).toBe(
      20,
    );
  });

  test("never goes below what is reserved", () => {
    expect(
      suggestedCapacityOf({
        defaultCapacity: 20,
        reserved: 19,
        probabilities: certain("much_less"),
      }),
    ).toBe(19);
  });

  test("suggests nothing for a product without a default", () => {
    expect(
      suggestedCapacityOf({ defaultCapacity: null, reserved: 0, probabilities: certain("more") }),
    ).toBeNull();
  });
});
