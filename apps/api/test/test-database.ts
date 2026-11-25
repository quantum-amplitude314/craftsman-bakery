import { z } from "zod";

const testDatabaseEnvSchema = z.object({
  TEST_DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

export const readTestDatabaseUrl = () => {
  const { TEST_DATABASE_URL: testDatabaseUrl } = testDatabaseEnvSchema.parse(process.env);
  const { hostname, pathname } = new URL(testDatabaseUrl);
  if (!["localhost", "127.0.0.1"].includes(hostname) || !pathname.endsWith("_test"))
    throw new Error("Tests only use a local database whose name ends with _test");
  if (testDatabaseUrl === process.env.DATABASE_URL)
    throw new Error("Test and development databases must be separate");

  return testDatabaseUrl;
};
