import { describe, expect, test } from "bun:test";
import { readSignInForm, signInFailureOf } from "../src/lib/sign-in-form.ts";

const formOf = (fields: Record<string, string>) => {
  const formData = new FormData();
  for (const [field, value] of Object.entries(fields)) formData.set(field, value);

  return formData;
};

describe("readSignInForm", () => {
  test("reads the email and password", () => {
    const form = readSignInForm(formOf({ email: "staff@bakery.test", password: "secret" }));

    expect(form).toEqual({
      status: "valid",
      input: { email: "staff@bakery.test", password: "secret" },
    });
  });

  test("names every missing field", () => {
    expect(readSignInForm(formOf({}))).toEqual({
      status: "invalid",
      invalidFields: ["email", "password"],
    });
  });

  test("rejects an address that is not an email", () => {
    const form = readSignInForm(formOf({ email: "staff", password: "secret" }));

    expect(form).toEqual({ status: "invalid", invalidFields: ["email"] });
  });
});

describe("signInFailureOf", () => {
  test("tells wrong credentials from too many attempts", () => {
    expect(signInFailureOf(401)).toEqual({ status: "wrong-credentials" });
    expect(signInFailureOf(429)).toEqual({ status: "too-many-attempts" });
  });

  test("reports any other answer as a failure to retry", () => {
    expect(signInFailureOf(403)).toEqual({ status: "failed" });
    expect(signInFailureOf(500)).toEqual({ status: "failed" });
  });
});
