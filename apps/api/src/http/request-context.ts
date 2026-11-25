import { createDrizzleReadStore } from "../adapters/drizzle-read-store.ts";
import { createDrizzleWriteStore } from "../adapters/drizzle-write-store.ts";
import { verifyTurnstile } from "../adapters/turnstile.ts";
import { createDb } from "../db/client.ts";
import { generateCode } from "../rules/code.ts";
import type { ApiContext } from "./handler.ts";

export const createRequestContext = ({ env, request }: { env: Env; request: Request }) => {
  const commands = createDb({ connectionString: env.HYPERDRIVE_COMMANDS.connectionString });
  const queries = createDb({ connectionString: env.HYPERDRIVE_QUERIES.connectionString });
  const remoteIp = request.headers.get("CF-Connecting-IP");
  const context: ApiContext = {
    writeStore: createDrizzleWriteStore({ db: commands.db }),
    readStore: createDrizzleReadStore({ db: queries.db }),
    freshReadStore: createDrizzleReadStore({ db: commands.db }),
    cutoff: { timeZone: env.BAKERY_TIME_ZONE, time: env.CUTOFF_TIME },
    now: () => new Date(),
    generateCode,
    verifyTurnstile: ({ token }) =>
      verifyTurnstile({ secret: env.TURNSTILE_SECRET_KEY, token, remoteIp }),
  };
  const close = async () => {
    await Promise.all([commands.close(), queries.close()]);
  };
  const requestContext = { context, close };

  return requestContext;
};
