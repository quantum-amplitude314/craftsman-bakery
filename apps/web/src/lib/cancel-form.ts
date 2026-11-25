import { codeSchema } from "@acme-bakery/contracts";
import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { TURNSTILE_FIELD } from "./turnstile.ts";

const FORM_FIELDS = ["code", "turnstile"] as const;

export type CancelFormField = (typeof FORM_FIELDS)[number];

export type CancelOutcome =
  | { status: "editing" }
  | { status: "invalid"; invalidFields: CancelFormField[] }
  | { status: "cancelled"; code: string }
  | { status: "not-found" }
  | { status: "closed" }
  | { status: "turnstile-failed" }
  | { status: "failed" };

/** `attempt` counts the submissions, so the Turnstile widget remounts for a fresh token. */
export type CancelState = CancelOutcome & { attempt: number };

const formSchema = z.object({ code: codeSchema, turnstileToken: z.string().min(1) });

export const readCancelForm = (formData: FormData) => {
  const parsed = formSchema.safeParse({
    code: formData.get("code") ?? "",
    turnstileToken: formData.get(TURNSTILE_FIELD) ?? "",
  });
  if (parsed.success) {
    const valid = { status: "valid" as const, input: parsed.data };

    return valid;
  }

  const { fieldErrors } = z.flattenError(parsed.error);
  const fieldsWithErrors = { code: fieldErrors.code, turnstile: fieldErrors.turnstileToken };
  const invalid = {
    status: "invalid" as const,
    invalidFields: FORM_FIELDS.filter((field) => fieldsWithErrors[field] !== undefined),
  };

  return invalid;
};

const FAILURES_BY_CODE: Record<string, CancelOutcome> = {
  NOT_FOUND: { status: "not-found" },
  RESERVATIONS_CLOSED: { status: "closed" },
  TURNSTILE_FAILED: { status: "turnstile-failed" },
};

export const cancelFailureOf = (error: unknown): CancelOutcome => {
  const failure = error instanceof ORPCError ? FAILURES_BY_CODE[error.code] : undefined;

  return failure ?? { status: "failed" };
};
