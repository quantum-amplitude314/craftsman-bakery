"use server";

import { redirect } from "next/navigation";
import { sendAuthRequest } from "@/lib/auth";
import { readSignInForm, type SignInState, signInFailureOf } from "@/lib/sign-in-form";

export const signIn = async (_previous: SignInState, formData: FormData): Promise<SignInState> => {
  const form = readSignInForm(formData);
  if (form.status === "invalid") return form;

  try {
    const response = await sendAuthRequest({ endpoint: "sign-in/email", body: form.input });
    if (!response.ok) return signInFailureOf(response.status);
  } catch {
    const failed: SignInState = { status: "failed" };

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
