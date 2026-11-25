import { hasSessionCookie } from "../lib/session-cookie.ts";

const STAFF_PATH = "/staff";
const SIGN_IN_PATH = "/staff/sign-in";

const PAGE_FILES: Record<string, string> = {
  "/cancel": "/cancel.html",
  "/staff/sign-in": "/staff/sign-in.html",
};

const isStaffPage = (path: string) => path === STAFF_PATH || path.startsWith(`${STAFF_PATH}/`);

const cookieNamesOf = (cookieHeader: string | null) =>
  new Set((cookieHeader ?? "").split(";").map((pair) => pair.split("=")[0]?.trim() ?? ""));

export const findStaffRedirect = ({
  path,
  cookieHeader,
}: {
  path: string;
  cookieHeader: string | null;
}) => {
  const signedIn = hasSessionCookie(cookieNamesOf(cookieHeader));
  if (path === SIGN_IN_PATH) return signedIn ? STAFF_PATH : null;
  if (!signedIn && isStaffPage(path)) return SIGN_IN_PATH;

  return null;
};

export const pageFileOf = (path: string) => PAGE_FILES[path] ?? null;
