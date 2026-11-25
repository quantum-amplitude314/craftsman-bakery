import { expect, test } from "bun:test";
import { teapot } from "../src/http/teapot.ts";

test("asking the bakery for coffee answers 418", async () => {
  const response = await teapot.request("/api/coffee", { method: "POST" });

  expect(response.status).toBe(418);
  expect(await response.text()).toContain("teapot");
});
