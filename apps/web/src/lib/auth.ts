import "server-only";

import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { apiFetch, getApiBaseUrl } from "@/lib/api-fetch";
import { getEnv } from "@/lib/env";
import { hasSessionCookie } from "@/lib/session-cookie";

const sessionSchema = z
  .object({ user: z.object({ name: z.string(), email: z.string() }) })
  .nullable();

const authUrlOf = async (endpoint: string) => `${await getApiBaseUrl()}/auth/${endpoint}`;

export const getStaffSession = async () => {
  const cookieStore = await cookies();
  if (!hasSessionCookie(cookieStore)) return null;

  const request = new Request(await authUrlOf("get-session"), {
    headers: { cookie: cookieStore.toString() },
  });
  const response = await apiFetch(request);
  if (!response.ok) throw new Error(`Session check failed with ${response.status}`);

  const session = sessionSchema.parse(await response.json());

  return session;
};

export const sendAuthRequest = async ({
  endpoint,
  body,
  turnstileToken,
}: {
  endpoint: "sign-in/email" | "sign-out";
  body: Record<string, unknown>;
  turnstileToken?: string | undefined;
}) => {
  const cookieStore = await cookies();
  const visitorIp = (await headers()).get("cf-connecting-ip");
  const { WEB_ORIGIN: webOrigin } = await getEnv();
  const request = new Request(await authUrlOf(endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: webOrigin,
      Cookie: cookieStore.toString(),
      ...(visitorIp && { "X-Forwarded-For": visitorIp }),
      ...(turnstileToken && { "x-captcha-response": turnstileToken }),
    },
    body: JSON.stringify(body),
  });
  const response = await apiFetch(request);

  for (const header of response.headers.getSetCookie()) {
    for (const [name, attributes] of parseSetCookieHeader(header)) {
      const { value } = attributes;
      cookieStore.set(name, value, toCookieOptions(attributes));
    }
  }

  return response;
};
