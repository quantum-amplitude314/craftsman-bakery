import { type NextRequest, NextResponse } from "next/server";
import { hasSessionCookie } from "./lib/session-cookie.ts";

const STAFF_PATH = "/staff";
const SIGN_IN_PATH = "/staff/sign-in";

const isStaffPage = (path: string) => path === STAFF_PATH || path.startsWith(`${STAFF_PATH}/`);

/**
 * Where the session cookie sends a request before anything renders. A cookie whose session is
 * gone still gets through; only the API knows, so the staff pages sign it out themselves.
 */
const findAuthRedirect = ({ path, signedIn }: { path: string; signedIn: boolean }) => {
  if (path === SIGN_IN_PATH) return signedIn ? STAFF_PATH : null;
  if (!signedIn && isStaffPage(path)) return SIGN_IN_PATH;

  return null;
};

export default function proxy(request: NextRequest) {
  const { nextUrl, cookies, url } = request;
  const redirectPath = findAuthRedirect({
    path: nextUrl.pathname,
    signedIn: hasSessionCookie(cookies),
  });
  if (redirectPath) return NextResponse.redirect(new URL(redirectPath, url));

  return NextResponse.next();
}

export const config = { matcher: "/staff/:path*" };
