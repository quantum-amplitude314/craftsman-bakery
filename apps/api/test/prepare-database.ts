import { sql } from "drizzle-orm";
import { createDb } from "../src/db/client.ts";
import { runMigrations } from "../src/db/migrate.ts";
import { readTestDatabaseUrl } from "./test-database.ts";

const databaseUrl = readTestDatabaseUrl();
const { db, close } = createDb({ connectionString: databaseUrl });
await db.execute(sql`drop schema if exists drizzle cascade`);
await db.execute(sql`drop schema if exists public cascade`);
await db.execute(sql`create schema public`);
await runMigrations({ db });
await close();
