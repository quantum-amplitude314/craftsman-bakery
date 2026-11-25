import { z } from "zod";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const siteverifySchema = z.object({ success: z.boolean() });

export const verifyTurnstile = async ({
  secret,
  token,
  remoteIp,
}: {
  secret: string;
  token: string;
  remoteIp: string | null;
}) => {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteIp) form.append("remoteip", remoteIp);
  const response = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
  if (!response.ok) return false;
  const { success } = siteverifySchema.parse(await response.json());

  return success;
};
