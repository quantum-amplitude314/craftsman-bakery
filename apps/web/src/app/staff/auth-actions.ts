"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sendAuthRequest } from "@/lib/auth";
import { readSignInForm, type SignInState, signInFailureOf } from "@/lib/sign-in-form";

/** Better Auth's error body; anything else reads as no code. */
const authErrorSchema = z.object({ code: z.string().optional() }).catch({});

export const signIn = async (previous: SignInState, formData: FormData): Promise<SignInState> => {
  const attempt = previous.attempt + 1;
  const form = readSignInForm(formData);
  if (form.status === "invalid") {
    const invalid: SignInState = { ...form, attempt };

    return invalid;
  }

  const { turnstileToken, ...credentials } = form.input;
  try {
    const response = await sendAuthRequest({
      endpoint: "sign-in/email",
      body: credentials,
      turnstileToken,
    });
    if (!response.ok) {
      const { status } = response;
      const { code } = authErrorSchema.parse(await response.json().catch(() => null));
      const failed: SignInState = { ...signInFailureOf({ status, code }), attempt };

      return failed;
    }
  } catch {
    const failed: SignInState = { status: "failed", attempt };

    return failed;
  }

  redirect("/staff");
};

/** Better Auth clears the cookies even when the session is already gone. */
export const signOut = async () => {
  const response = await sendAuthRequest({ endpoint: "sign-out", body: {} });
  if (!response.ok) throw new Error(`Sign-out failed with ${response.status}`);

  redirect("/staff/sign-in");
};
