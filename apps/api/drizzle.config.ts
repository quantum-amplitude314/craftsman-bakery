import { defineConfig } from "drizzle-kit";
import { z } from "zod";

const { DATABASE_URL: databaseUrl } = z
  .object({ DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }) })
  .parse(process.env);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./migrations",
  casing: "snake_case",
  dbCredentials: { url: databaseUrl },
});
