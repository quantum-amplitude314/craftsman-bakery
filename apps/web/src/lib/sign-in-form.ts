import { z } from "zod";
import { TURNSTILE_FIELD } from "./turnstile.ts";

const FORM_FIELDS = ["email", "password", "turnstile"] as const;

export type SignInFormField = (typeof FORM_FIELDS)[number];

export type SignInOutcome =
  | { status: "editing" }
  | { status: "invalid"; invalidFields: SignInFormField[] }
  | { status: "wrong-credentials" }
  | { status: "too-many-attempts" }
  | { status: "turnstile-failed" }
  | { status: "failed" };

export type SignInState = SignInOutcome & { attempt: number };

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  turnstileToken: z.string().min(1),
});

export const readSignInForm = (formData: FormData) => {
  const parsed = formSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    turnstileToken: formData.get(TURNSTILE_FIELD) ?? "",
  });
  if (parsed.success) {
    const valid = { status: "valid" as const, input: parsed.data };

    return valid;
  }

  const { fieldErrors } = z.flattenError(parsed.error);
  const fieldsWithErrors = {
    email: fieldErrors.email,
    password: fieldErrors.password,
    turnstile: fieldErrors.turnstileToken,
  };
  const invalid = {
    status: "invalid" as const,
    invalidFields: FORM_FIELDS.filter((field) => fieldsWithErrors[field] !== undefined),
  };

  return invalid;
};

const FAILURES_BY_STATUS: Record<number, SignInOutcome> = {
  401: { status: "wrong-credentials" },
  429: { status: "too-many-attempts" },
};

const FAILURES_BY_CODE: Record<string, SignInOutcome> = {
  TURNSTILE_FAILED: { status: "turnstile-failed" },
};

export const signInFailureOf = ({
  status,
  code,
}: {
  status: number;
  code?: string | undefined;
}): SignInOutcome => {
  const failure = FAILURES_BY_STATUS[status] ??
    FAILURES_BY_CODE[code ?? ""] ?? { status: "failed" };

  return failure;
};
