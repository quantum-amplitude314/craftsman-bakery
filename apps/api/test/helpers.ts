import { and, eq, sql } from "drizzle-orm";
import { createDb, type Db } from "../src/db/client.ts";
import { capacity, product } from "../src/db/schema.ts";
import { readTestDatabaseUrl } from "./test-database.ts";

export const createTestDb = () => createDb({ connectionString: readTestDatabaseUrl() });

// Drizzle queries are lazy thenables, not Promises: await them so bun:test hooks run them.
export const resetTables = async ({ db }: { db: Db }) => {
  await db.execute(sql`truncate reservation_item, reservation, capacity, product`);
};

export const seedProduct = async ({ db, name }: { db: Db; name: string }) => {
  const [created] = await db.insert(product).values({ name }).returning({ id: product.id });
  if (!created) throw new Error("Product not created");

  return created.id;
};

export const seedCapacity = ({
  db,
  productId,
  pickupDay,
  limit,
}: {
  db: Db;
  productId: string;
  pickupDay: string;
  limit: number;
}) => db.insert(capacity).values({ productId, pickupDay, capacity: limit });

export const reservedOf = async ({
  db,
  productId,
  pickupDay,
}: {
  db: Db;
  productId: string;
  pickupDay: string;
}) => {
  const [row] = await db
    .select({ reserved: capacity.reserved })
    .from(capacity)
    .where(and(eq(capacity.productId, productId), eq(capacity.pickupDay, pickupDay)));

  return row?.reserved ?? 0;
};

export const codesFrom = (codes: string[]) => {
  const queue = [...codes];
  const nextCode = () => {
    const code = queue.shift();
    if (!code) throw new Error("No test code left");

    return code;
  };

  return nextCode;
};
