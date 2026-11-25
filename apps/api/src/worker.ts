import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { createDb } from "./db/client.ts";
import { isReservationClosed, wallClock } from "./rules/cutoff.ts";

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
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const health = {
    databaseTime: rows[0]?.database_time,
    workerTime: now.toISOString(),
    bakeryClock: wallClock({ instant: now, timeZone }),
    tomorrow,
    tomorrowClosed: isReservationClosed({ now, pickupDay: tomorrow, cutoff: { timeZone, time } }),
  };

  return context.json(health);
});

export default app;
