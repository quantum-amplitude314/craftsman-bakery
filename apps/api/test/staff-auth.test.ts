import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createAuth } from "../src/auth/auth.ts";
import { createTestDb, resetTables, seedStaff } from "./helpers.ts";

const { db, close } = createTestDb();
const origin = "http://bakery.test";
const STAFF = { email: "staff@bakery.test", password: "staff-password" };
const PASSING_TOKEN = "passing-token";
const auth = createAuth({
  db,
  secret: "test-secret-at-least-32-characters-long",
  baseURL: origin,
  trustedOrigins: [origin],
  verifyTurnstile: async ({ token }) => token === PASSING_TOKEN,
});

const postAuth = ({
  path,
  body,
  turnstileToken = PASSING_TOKEN,
}: {
  path: string;
  body: unknown;
  turnstileToken?: string | null;
}) =>
  auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin,
        ...(turnstileToken && { "x-captcha-response": turnstileToken }),
      },
      body: JSON.stringify(body),
    }),
  );

const readCode = async (response: Response) => {
  const { code } = (await response.json()) as { code?: string };

  return code;
};

beforeEach(async () => {
  await resetTables({ db });
  await seedStaff({ db, ...STAFF });
});
afterAll(() => close());

describe("staff sign-in", () => {
  test("a staff account signs in and gets a session", async () => {
    const { email, password } = STAFF;

    const response = await postAuth({ path: "/sign-in/email", body: { email, password } });
    const [sessionCookie = ""] = (response.headers.get("set-cookie") ?? "").split(";");
    const session = await auth.api.getSession({ headers: new Headers({ cookie: sessionCookie }) });

    expect(response.status).toBe(200);
    expect(session?.user.email).toBe(email);
  });

  test("a wrong password is refused", async () => {
    const { email } = STAFF;

    const response = await postAuth({
      path: "/sign-in/email",
      body: { email, password: "not-the-password" },
    });

    expect(response.status).toBe(401);
  });

  test("sign-in without a passing Turnstile token is refused before the password is checked", async () => {
    const { email, password } = STAFF;

    const missing = await postAuth({
      path: "/sign-in/email",
      body: { email, password },
      turnstileToken: null,
    });
    const failing = await postAuth({
      path: "/sign-in/email",
      body: { email, password },
      turnstileToken: "failing-token",
    });

    expect(missing.status).toBe(403);
    expect(await readCode(missing)).toBe("TURNSTILE_FAILED");
    expect(failing.status).toBe(403);
    expect(await readCode(failing)).toBe("TURNSTILE_FAILED");
  });

  test("nobody signs up", async () => {
    const response = await postAuth({
      path: "/sign-up/email",
      body: { name: "Mallory", email: "mallory@example.com", password: "long-enough-password" },
    });

    expect(response.ok).toBe(false);
  });
});
