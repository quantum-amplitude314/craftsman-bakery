import { describe, expect, test } from "bun:test";
import { ORPCError } from "@orpc/client";
import {
  quantityFieldOf,
  readReservationForm,
  reserveFailureOf,
} from "../src/lib/reservation-form.ts";

const BREAD = "71ddf971-0f2c-4dbf-be2e-dd161649ff2c";
const CROISSANT = "a13897e3-59c2-4088-b1e4-2290d2505881";
const PICKUP_DAY = "2026-12-24";

const formOf = (fields: Record<string, string>) => {
  const formData = new FormData();
  for (const [field, value] of Object.entries(fields)) formData.set(field, value);

  return formData;
};

const filledForm = {
  pickupDay: PICKUP_DAY,
  name: "Jana",
  phone: "+420 777 123 456",
  [quantityFieldOf(BREAD)]: "2",
  [quantityFieldOf(CROISSANT)]: "0",
  "cf-turnstile-response": "turnstile-token",
};

describe("readReservationForm", () => {
  test("keeps the items with a quantity, and the Turnstile token", () => {
    const read = readReservationForm(formOf(filledForm));

    expect(read).toEqual({
      status: "valid",
      input: {
        pickupDay: PICKUP_DAY,
        name: "Jana",
        phone: "+420 777 123 456",
        items: [{ productId: BREAD, quantity: 2 }],
        turnstileToken: "turnstile-token",
      },
    });
  });

  test("names every field to fix", () => {
    const read = readReservationForm(
      formOf({ pickupDay: PICKUP_DAY, name: " ", phone: "call me", [quantityFieldOf(BREAD)]: "" }),
    );

    expect(read).toEqual({
      status: "invalid",
      invalidFields: ["name", "phone", "items", "turnstile"],
    });
  });
});

describe("reserveFailureOf", () => {
  const items = [
    { productId: BREAD, quantity: 2 },
    { productId: CROISSANT, quantity: 5 },
  ];
  const freshAvailability = {
    pickupDay: PICKUP_DAY,
    closesAt: "2026-12-23T18:00",
    products: [
      { productId: BREAD, name: "Bread", available: 4 },
      { productId: CROISSANT, name: "Croissant", available: 3 },
    ],
  };

  test("a capacity conflict names what no longer fits, with the fresh availability", () => {
    const error = new ORPCError("CAPACITY_EXCEEDED", {
      defined: true,
      status: 409,
      data: freshAvailability,
    });

    expect(reserveFailureOf({ error, items })).toEqual({
      status: "no-longer-fits",
      productNames: ["Croissant"],
      availability: freshAvailability,
    });
  });

  test("the cutoff, a failed Turnstile check and anything else get their own outcome", () => {
    const outcomes = [
      new ORPCError("RESERVATIONS_CLOSED", { defined: true, status: 422 }),
      new ORPCError("TURNSTILE_FAILED", { defined: true, status: 403 }),
      new Error("network down"),
    ].map((error) => reserveFailureOf({ error, items }).status);

    expect(outcomes).toEqual(["closed", "turnstile-failed", "failed"]);
  });
});
