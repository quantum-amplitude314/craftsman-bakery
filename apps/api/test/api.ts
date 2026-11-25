import { createDrizzleReadStore } from "../src/adapters/drizzle-read-store.ts";
import { createDrizzleWriteStore } from "../src/adapters/drizzle-write-store.ts";
import type { Db } from "../src/db/client.ts";
import { type ApiContext, createApiHandler } from "../src/http/handler.ts";
import { codesFrom } from "./helpers.ts";

const handler = createApiHandler();

export const createApiTestContext = ({
  db,
  turnstilePasses = true,
  isStaff = false,
  now = "2026-12-23T12:00:00Z",
}: {
  db: Db;
  turnstilePasses?: boolean;
  isStaff?: boolean;
  now?: string;
}) => {
  const readStore = createDrizzleReadStore({ db });
  const context: ApiContext = {
    writeStore: createDrizzleWriteStore({ db }),
    readStore,
    freshReadStore: readStore,
    cutoff: { timeZone: "Europe/Prague", time: "18:00" },
    now: () => new Date(now),
    generateCode: codesFrom(["K7M2"]),
    verifyTurnstile: async () => turnstilePasses,
    isStaff: async () => isStaff,
  };

  return context;
};

export const sendApi = async ({
  method,
  path,
  body,
  context,
}: {
  method: "GET" | "POST" | "PUT";
  path: string;
  body?: unknown;
  context: ApiContext;
}) => {
  const request = new Request(`http://bakery.test/api${path}`, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const { response } = await handler.handle(request, { prefix: "/api", context });
  if (!response) throw new Error(`No route for ${method} ${path}`);
  const result = { status: response.status, body: await response.json().catch(() => null) };

  return result;
};
