import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

const bakeryTimeZone = z.string().min(1);
/** Where the site is served; absolute URLs such as the share image resolve against it. */
const webOrigin = z.url();

const envSchema = z
  .discriminatedUnion("WRANGLER_BINDING", [
    z.object({
      WRANGLER_BINDING: z.literal("on"),
      BAKERY_TIME_ZONE: bakeryTimeZone,
      WEB_ORIGIN: webOrigin,
    }),
    z.object({
      WRANGLER_BINDING: z.literal("off"),
      BAKERY_TIME_ZONE: bakeryTimeZone,
      WEB_ORIGIN: webOrigin,
      API_URL: z.url(),
    }),
  ])
  .readonly();

type Env = z.infer<typeof envSchema>;

const readWorkerEnv = async () => {
  const { env: workerEnv } = await getCloudflareContext({ async: true });

  return workerEnv;
};

const loadEnv = async () => {
  // only `.env.development` sets "off": `next dev` runs without wrangler
  const isNextDev = process.env.WRANGLER_BINDING === "off";
  const settings = isNextDev ? process.env : await readWorkerEnv();
  const parsed = envSchema.parse(settings);

  return parsed;
};

let env: Promise<Env> | undefined;

export const getEnv = () => {
  env ??= loadEnv();

  return env;
};
