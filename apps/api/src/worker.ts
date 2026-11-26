import { wallClockOf } from "@craftsman-bakery/contracts";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { verifyTurnstile } from "./adapters/turnstile.ts";
import { createAuth } from "./auth/auth.ts";
import { createDb } from "./db/client.ts";
import { createApiHandler } from "./http/handler.ts";
import { createRequestContext } from "./http/request-context.ts";
import { teapot } from "./http/teapot.ts";
import { nextOpenPickupDay } from "./rules/cutoff.ts";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", async (context) => {
  const {
    HYPERDRIVE_QUERIES: hyperdrive,
    BAKERY_TIME_ZONE: timeZone,
    CUTOFF_TIME: time,
  } = context.env;
  const { db, close } = createDb({ connectionString: hyperdrive.connectionString });
  const { rows } = await db.execute(sql`select now() as database_time`);
  context.executionCtx.waitUntil(close());
  const now = new Date();
  const health = {
    databaseTime: rows[0]?.database_time,
    workerTime: now.toISOString(),
    bakeryClock: wallClockOf({ instant: now, timeZone }),
    nextPickupDay: nextOpenPickupDay({ now, cutoff: { timeZone, time } }),
  };

  return context.json(health);
});

app.route("/", teapot);

app.on(["GET", "POST"], "/api/auth/*", async (context) => {
  const {
    HYPERDRIVE_COMMANDS: hyperdrive,
    BETTER_AUTH_SECRET: secret,
    TURNSTILE_SECRET_KEY: turnstileSecret,
    WEB_ORIGIN: webOrigin,
  } = context.env;
  const { db, close } = createDb({ connectionString: hyperdrive.connectionString });
  const { raw: request } = context.req;
  const remoteIp = request.headers.get("X-Forwarded-For");
  const auth = createAuth({
    db,
    secret,
    baseURL: webOrigin,
    trustedOrigins: [webOrigin],
    verifyTurnstile: ({ token }) => verifyTurnstile({ secret: turnstileSecret, token, remoteIp }),
  });
  const response = await auth.handler(request);
  context.executionCtx.waitUntil(close());

  return response;
});

const apiHandler = createApiHandler();

app.all("/api/*", async (context) => {
  const { raw: request } = context.req;
  const { context: apiContext, close } = createRequestContext({ env: context.env, request });
  const { matched, response } = await apiHandler.handle(request, {
    prefix: "/api",
    context: apiContext,
  });
  context.executionCtx.waitUntil(close());

  return matched ? response : context.notFound();
});

export default app;
