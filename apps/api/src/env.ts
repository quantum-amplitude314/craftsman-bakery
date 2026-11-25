import { z } from "zod";

const databaseEnvSchema = z.object({ DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }) });

export const readDatabaseEnv = () => {
  const databaseEnv = databaseEnvSchema.parse(process.env);

  return databaseEnv;
};
