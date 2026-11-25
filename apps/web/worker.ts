// @ts-expect-error The OpenNext build generates this JavaScript entry without types.
import openNextWorker from "./.open-next/worker.js";

export default {
  fetch: (request, env, ctx) => openNextWorker.fetch(request, env, ctx),
} satisfies ExportedHandler<CloudflareEnv>;
