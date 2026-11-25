import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import proxy from "../src/proxy.ts";

const PLAIN_SESSION_COOKIE = "better-auth.session_token=token";
const SECURE_SESSION_COOKIE = "__Secure-better-auth.session_token=token";

const redirectTarget = ({ path, cookie }: { path: string; cookie?: string }) => {
  const headers = cookie ? { cookie } : undefined;
  const request = new NextRequest(new URL(path, "https://bakery.test"), { headers });
  const location = proxy(request).headers.get("location");
  const target = location ? new URL(location).pathname : null;

  return target;
};

describe("proxy", () => {
  test("sends staff pages without a session cookie to sign-in", () => {
    expect(redirectTarget({ path: "/staff" })).toBe("/staff/sign-in");
    expect(redirectTarget({ path: "/staff/2026-11-26" })).toBe("/staff/sign-in");
  });

  test("lets staff pages through with either session cookie name", () => {
    expect(redirectTarget({ path: "/staff", cookie: PLAIN_SESSION_COOKIE })).toBeNull();
    expect(redirectTarget({ path: "/staff", cookie: SECURE_SESSION_COOKIE })).toBeNull();
  });

  test("sends sign-in with a session cookie to the staff page", () => {
    expect(redirectTarget({ path: "/staff/sign-in", cookie: PLAIN_SESSION_COOKIE })).toBe("/staff");
  });

  test("leaves sign-in and customer pages to the page itself", () => {
    expect(redirectTarget({ path: "/staff/sign-in" })).toBeNull();
    expect(redirectTarget({ path: "/" })).toBeNull();
    expect(redirectTarget({ path: "/cancel" })).toBeNull();
  });

  test("does not mistake a path that only starts like a staff page", () => {
    expect(redirectTarget({ path: "/staffroom" })).toBeNull();
  });
});
