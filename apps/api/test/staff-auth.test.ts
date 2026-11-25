import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createAuth } from "../src/auth/auth.ts";
import { createStaff } from "../src/auth/create-staff.ts";
import { DEMO_STAFF } from "../src/auth/demo-staff.ts";
import { createTestDb, resetTables } from "./helpers.ts";

const { db, close } = createTestDb();
const origin = "http://bakery.test";
const auth = createAuth({
  db,
  secret: "test-secret-at-least-32-characters-long",
  baseURL: origin,
  trustedOrigins: [origin],
});

const postAuth = ({ path, body }: { path: string; body: unknown }) =>
  auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify(body),
    }),
  );

beforeEach(async () => {
  await resetTables({ db });
  await createStaff({ db, ...DEMO_STAFF });
});
afterAll(() => close());

describe("staff sign-in", () => {
  test("the demo staff account signs in and gets a session", async () => {
    const { email, password } = DEMO_STAFF;

    const response = await postAuth({ path: "/sign-in/email", body: { email, password } });
    const [sessionCookie = ""] = (response.headers.get("set-cookie") ?? "").split(";");
    const session = await auth.api.getSession({ headers: new Headers({ cookie: sessionCookie }) });

    expect(response.status).toBe(200);
    expect(session?.user.email).toBe(email);
  });

  test("a wrong password is refused", async () => {
    const { email } = DEMO_STAFF;

    const response = await postAuth({
      path: "/sign-in/email",
      body: { email, password: "not-the-password" },
    });

    expect(response.status).toBe(401);
  });

  test("nobody signs up", async () => {
    const response = await postAuth({
      path: "/sign-up/email",
      body: { name: "Mallory", email: "mallory@example.com", password: "long-enough-password" },
    });

    expect(response.ok).toBe(false);
  });
});
