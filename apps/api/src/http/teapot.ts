import { Hono } from "hono";

/** RFC 2324 teapot; any standard method (workerd answers 501 to BREW). Not in the contract on purpose. */
export const teapot = new Hono().all("/api/coffee", (context) =>
  context.text("418 I'm a teapot. This is a bakery: bread, yes; coffee, no.", 418),
);
