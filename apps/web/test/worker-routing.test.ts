import { describe, expect, test } from "bun:test";
import { findStaffRedirect, pageFileOf } from "../src/worker/routing.ts";

const PLAIN_SESSION_COOKIE = "better-auth.session_token=token";
const SECURE_SESSION_COOKIE = "theme=light; __Secure-better-auth.session_token=token";

describe("findStaffRedirect", () => {
  test("sends staff pages without a session cookie to sign-in", () => {
    expect(findStaffRedirect({ path: "/staff", cookieHeader: null })).toBe("/staff/sign-in");
    expect(findStaffRedirect({ path: "/staff/2026-11-26", cookieHeader: "theme=light" })).toBe(
      "/staff/sign-in",
    );
  });

  test("lets staff pages through with either session cookie name", () => {
    expect(findStaffRedirect({ path: "/staff", cookieHeader: PLAIN_SESSION_COOKIE })).toBeNull();
    expect(findStaffRedirect({ path: "/staff", cookieHeader: SECURE_SESSION_COOKIE })).toBeNull();
  });

  test("sends sign-in with a session cookie to the staff page", () => {
    expect(findStaffRedirect({ path: "/staff/sign-in", cookieHeader: PLAIN_SESSION_COOKIE })).toBe(
      "/staff",
    );
  });

  test("leaves sign-in and customer pages to the assets", () => {
    expect(findStaffRedirect({ path: "/staff/sign-in", cookieHeader: null })).toBeNull();
    expect(findStaffRedirect({ path: "/", cookieHeader: null })).toBeNull();
    expect(findStaffRedirect({ path: "/staffroom", cookieHeader: null })).toBeNull();
  });
});

describe("pageFileOf", () => {
  test("maps each fully static page to the file the build prerendered", () => {
    expect(pageFileOf("/cancel")).toBe("/cancel.html");
    expect(pageFileOf("/staff/sign-in")).toBe("/staff/sign-in.html");
  });

  test("leaves pages with streamed parts to Next, and other paths to the assets", () => {
    expect(pageFileOf("/")).toBeNull();
    expect(pageFileOf("/staff")).toBeNull();
    expect(pageFileOf("/cancel/")).toBeNull();
  });
});
