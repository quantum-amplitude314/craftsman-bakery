import { describe, expect, test } from "bun:test";
import { ORPCError } from "@orpc/client";
import { cancelFailureOf, readCancelForm } from "../src/lib/cancel-form.ts";

const formOf = (fields: Record<string, string>) => {
  const formData = new FormData();
  for (const [field, value] of Object.entries(fields)) formData.set(field, value);

  return formData;
};

describe("readCancelForm", () => {
  test("normalizes the code as typed, and keeps the Turnstile token", () => {
    const read = readCancelForm(formOf({ code: " k7m2 ", "cf-turnstile-response": "token" }));

    expect(read).toEqual({
      status: "valid",
      input: { code: "K7M2", turnstileToken: "token" },
    });
  });

  test("names every field to fix", () => {
    const read = readCancelForm(formOf({ code: "K7M" }));

    expect(read).toEqual({ status: "invalid", invalidFields: ["code", "turnstile"] });
  });
});

describe("cancelFailureOf", () => {
  test("an unknown code, the cutoff, a failed Turnstile check and anything else", () => {
    const outcomes = [
      new ORPCError("NOT_FOUND", { defined: true, status: 404 }),
      new ORPCError("RESERVATIONS_CLOSED", { defined: true, status: 422 }),
      new ORPCError("TURNSTILE_FAILED", { defined: true, status: 403 }),
      new Error("network down"),
    ].map((error) => cancelFailureOf(error).status);

    expect(outcomes).toEqual(["not-found", "closed", "turnstile-failed", "failed"]);
  });
});
