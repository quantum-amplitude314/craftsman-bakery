import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import type { Db } from "../db/client.ts";
import { account, session, user, verification } from "../db/schema.ts";

const SESSION_DAYS = 7;

/** Staff only: accounts are seeded, so sign-up is closed. */
export const createAuth = ({
  db,
  secret,
  baseURL,
  trustedOrigins,
}: {
  db: Db;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
}) => {
  const auth = betterAuth({
    appName: "Craftsman Bakery",
    baseURL,
    basePath: "/api/auth",
    secret,
    trustedOrigins,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user, session, account, verification },
      transaction: true,
    }),
    emailAndPassword: { enabled: true, disableSignUp: true },
    session: { expiresIn: 60 * 60 * 24 * SESSION_DAYS },
  });

  return auth;
};

export type Auth = ReturnType<typeof createAuth>;
