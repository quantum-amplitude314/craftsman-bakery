import type { Db } from "../db/client.ts";
import { createAuth } from "./auth.ts";

/** Signs nobody in, so the secret signs no cookie and is not needed. */
const UNUSED_SECRET = "create-staff-signs-no-cookies-000000";

export const createStaff = async ({
  db,
  name,
  email,
  password,
}: {
  db: Db;
  name: string;
  email: string;
  password: string;
}) => {
  const auth = createAuth({
    db,
    secret: UNUSED_SECRET,
    baseURL: "http://localhost",
    trustedOrigins: [],
    signUp: "open",
  });
  await auth.api.signUpEmail({ body: { name, email, password } });
};
