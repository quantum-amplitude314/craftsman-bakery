import { describe, expect, test } from "bun:test";
import { readSignInForm, signInFailureOf } from "../src/lib/sign-in-form.ts";

const formOf = (fields: Record<string, string>) => {
  const formData = new FormData();
  for (const [field, value] of Object.entries(fields)) formData.set(field, value);

  return formData;
};

describe("readSignInForm", () => {
  test("reads the email, the password and the Turnstile token", () => {
    const form = readSignInForm(
      formOf({
        email: "staff@bakery.test",
        password: "secret",
        "cf-turnstile-response": "token",
      }),
    );

    expect(form).toEqual({
      status: "valid",
      input: { email: "staff@bakery.test", password: "secret", turnstileToken: "token" },
    });
  });

  test("names every missing field", () => {
    expect(readSignInForm(formOf({}))).toEqual({
      status: "invalid",
      invalidFields: ["email", "password", "turnstile"],
    });
  });

  test("rejects an address that is not an email", () => {
    const form = readSignInForm(
      formOf({ email: "staff", password: "secret", "cf-turnstile-response": "token" }),
    );

    expect(form).toEqual({ status: "invalid", invalidFields: ["email"] });
  });
});

describe("signInFailureOf", () => {
  test("tells wrong credentials, too many attempts and a failed Turnstile check apart", () => {
    expect(signInFailureOf({ status: 401 })).toEqual({ status: "wrong-credentials" });
    expect(signInFailureOf({ status: 429 })).toEqual({ status: "too-many-attempts" });
    expect(signInFailureOf({ status: 403, code: "TURNSTILE_FAILED" })).toEqual({
      status: "turnstile-failed",
    });
  });

  test("reports any other answer as a failure to retry", () => {
    expect(signInFailureOf({ status: 403, code: "INVALID_ORIGIN" })).toEqual({ status: "failed" });
    expect(signInFailureOf({ status: 500 })).toEqual({ status: "failed" });
  });
});
