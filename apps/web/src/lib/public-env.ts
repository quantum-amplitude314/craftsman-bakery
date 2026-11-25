import { z } from "zod";

/** Next inlines a key only where `process.env.NEXT_PUBLIC_*` is spelled out in full. */
const publicEnvSchema = z
  .object({
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
    NEXT_PUBLIC_WEB_ORIGIN: z.url(),
  })
  .readonly();

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_WEB_ORIGIN: process.env.NEXT_PUBLIC_WEB_ORIGIN,
});
