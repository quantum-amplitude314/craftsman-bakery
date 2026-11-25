import { z } from "zod";

const FORM_FIELDS = ["email", "password"] as const;

export type SignInFormField = (typeof FORM_FIELDS)[number];

export type SignInState =
  | { status: "editing" }
  | { status: "invalid"; invalidFields: SignInFormField[] }
  | { status: "wrong-credentials" }
  | { status: "too-many-attempts" }
  | { status: "failed" };

const formSchema = z.object({ email: z.email(), password: z.string().min(1) });

export const readSignInForm = (formData: FormData) => {
  const parsed = formSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  if (parsed.success) {
    const valid = { status: "valid" as const, input: parsed.data };

    return valid;
  }

  const { fieldErrors } = z.flattenError(parsed.error);
  const invalid = {
    status: "invalid" as const,
    invalidFields: FORM_FIELDS.filter((field) => fieldErrors[field] !== undefined),
  };

  return invalid;
};

/** Better Auth answers wrong credentials with 401 and its rate limit with 429. */
const FAILURES_BY_STATUS: Record<number, SignInState> = {
  401: { status: "wrong-credentials" },
  429: { status: "too-many-attempts" },
};

export const signInFailureOf = (status: number): SignInState =>
  FAILURES_BY_STATUS[status] ?? { status: "failed" };
