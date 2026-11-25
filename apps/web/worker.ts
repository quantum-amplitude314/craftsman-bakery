// @ts-expect-error The OpenNext build generates this JavaScript entry without types.
import openNextWorker from "./.open-next/worker.js";
import { findStaffRedirect, pageFileOf } from "./src/worker/routing.ts";

const isServerAction = ({ method }: Request) => method === "POST";
const isNextNavigation = ({ headers }: Request) => headers.get("RSC") === "1";

export default {
  fetch: async (request, env, ctx) => {
    if (isServerAction(request)) return openNextWorker.fetch(request, env, ctx);
    const { url, headers } = request;
    const { pathname } = new URL(url);
    const redirectPath = findStaffRedirect({ path: pathname, cookieHeader: headers.get("cookie") });
    if (redirectPath) return Response.redirect(new URL(redirectPath, url).toString(), 302);
    const pageFile = pageFileOf(pathname);
    if (!pageFile || isNextNavigation(request)) return openNextWorker.fetch(request, env, ctx);

    return env.ASSETS.fetch(new Request(new URL(pageFile, url), request));
  },
} satisfies ExportedHandler<Cloudflare.Env>;
