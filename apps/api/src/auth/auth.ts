import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import type { Db } from "../db/client.ts";
import { account, session, user, verification } from "../db/schema.ts";

const SESSION_DAYS = 7;
const TURNSTILE_HEADER = "x-captcha-response";

/** Staff only: accounts are seeded, so sign-up is closed. */
export const createAuth = ({
  db,
  secret,
  baseURL,
  trustedOrigins,
  verifyTurnstile,
}: {
  db: Db;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  verifyTurnstile: (input: { token: string }) => Promise<boolean>;
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
    hooks: {
      before: createAuthMiddleware(async ({ path, headers }) => {
        if (path !== "/sign-in/email") return;
        const token = headers?.get(TURNSTILE_HEADER);
        if (token && (await verifyTurnstile({ token }))) return;
        throw new APIError("FORBIDDEN", {
          message: "The Turnstile check failed",
          code: "TURNSTILE_FAILED",
        });
      }),
    },
  });

  return auth;
};

export type Auth = ReturnType<typeof createAuth>;
