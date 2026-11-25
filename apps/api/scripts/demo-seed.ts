import { eq } from "drizzle-orm";
import { z } from "zod";
import { createStaff } from "../src/auth/create-staff.ts";
import { DEMO_STAFF } from "../src/auth/demo-staff.ts";
import { createDb } from "../src/db/client.ts";
import { capacity, product, user } from "../src/db/schema.ts";

const DAYS_AHEAD = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_CAPACITY: Record<string, number> = {
  Bread: 20,
  "Rye bread": 15,
  Baguette: 25,
  Croissant: 40,
  "Cinnamon roll": 30,
};

const { DATABASE_URL: databaseUrl } = z
  .object({ DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }) })
  .parse(process.env);
const { db, close } = createDb({ connectionString: databaseUrl });

await db
  .insert(product)
  .values(Object.keys(DAILY_CAPACITY).map((name) => ({ name })))
  .onConflictDoNothing();
const products = await db.select().from(product);

const today = Date.now();
const pickupDays = Array.from({ length: DAYS_AHEAD }, (_, index) =>
  new Date(today + (index + 1) * DAY_MS).toISOString().slice(0, 10),
);
await db
  .insert(capacity)
  .values(
    pickupDays.flatMap((pickupDay) =>
      products.map(({ id, name }) => ({
        productId: id,
        pickupDay,
        capacity: DAILY_CAPACITY[name] ?? 10,
      })),
    ),
  )
  .onConflictDoNothing();

const [existingStaff] = await db.select().from(user).where(eq(user.email, DEMO_STAFF.email));
if (!existingStaff) await createStaff({ db, ...DEMO_STAFF });

await close();
console.log(
  `Seeded ${products.length} products for ${pickupDays.join(", ")}; staff ${DEMO_STAFF.email}`,
);
