import { defineConfig } from "drizzle-kit";
import { readDatabaseEnv } from "./src/env.ts";

const { DATABASE_URL: databaseUrl } = readDatabaseEnv();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./migrations",
  casing: "snake_case",
  dbCredentials: { url: databaseUrl },
});
