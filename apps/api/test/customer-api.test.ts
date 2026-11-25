import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import type { ApiContext } from "../src/http/handler.ts";
import { createApiTestContext, sendApi } from "./api.ts";
import { createTestDb, reservedOf, resetTables, seedCapacity, seedProduct } from "./helpers.ts";

const { db, close } = createTestDb();
const pickupDay = "2026-12-24";

const contextWith = (options: { turnstilePasses?: boolean; now?: string }) =>
  createApiTestContext({ db, ...options });

const send = ({
  context = contextWith({}),
  ...request
}: Omit<Parameters<typeof sendApi>[0], "context"> & { context?: ApiContext }) =>
  sendApi({ ...request, context });

const reservationBody = ({ productId, quantity }: { productId: string; quantity: number }) => ({
  pickupDay,
  name: "Ada",
  phone: "+420 777 123 456",
  items: [{ productId, quantity }],
  turnstileToken: "token",
});

beforeEach(() => resetTables({ db }));
afterAll(() => close());

describe("customer API", () => {
  test("GET /availability lists what is left for a pickup day", async () => {
    const bread = await seedProduct({ db, name: "Bread" });
    await seedCapacity({ db, productId: bread, pickupDay, limit: 5, reserved: 1 });

    const { status, body } = await send({
      method: "GET",
      path: `/availability?pickupDay=${pickupDay}`,
    });

    expect(status).toBe(200);
    expect(body).toEqual({
      pickupDay,
      closesAt: "2026-12-23T18:00",
      products: [{ productId: bread, name: "Bread", available: 4 }],
    });
  });

  test("POST /reservations reserves and answers 201 with the code", async () => {
    const bread = await seedProduct({ db, name: "Bread" });
    await seedCapacity({ db, productId: bread, pickupDay, limit: 5 });

    const { status, body } = await send({
      method: "POST",
      path: "/reservations",
      body: reservationBody({ productId: bread, quantity: 2 }),
    });

    expect(status).toBe(201);
    expect(body).toEqual({ code: "K7M2", pickupDay });
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(2);
  });

  test("POST /reservations answers 409 with the current availability when an item does not fit", async () => {
    const bread = await seedProduct({ db, name: "Bread" });
    await seedCapacity({ db, productId: bread, pickupDay, limit: 3, reserved: 2 });

    const { status, body } = await send({
      method: "POST",
      path: "/reservations",
      body: reservationBody({ productId: bread, quantity: 2 }),
    });

    expect(status).toBe(409);
    expect(body).toMatchObject({
      code: "CAPACITY_EXCEEDED",
      data: { pickupDay, products: [{ productId: bread, name: "Bread", available: 1 }] },
    });
  });

  test("POST /reservations answers 422 after the cutoff", async () => {
    const bread = await seedProduct({ db, name: "Bread" });
    await seedCapacity({ db, productId: bread, pickupDay, limit: 5 });

    const { status, body } = await send({
      method: "POST",
      path: "/reservations",
      body: reservationBody({ productId: bread, quantity: 1 }),
      context: contextWith({ now: "2026-12-23T17:00:00Z" }),
    });

    expect(status).toBe(422);
    expect(body).toMatchObject({ code: "RESERVATIONS_CLOSED" });
  });

  test("POST /reservations answers 403 and reserves nothing when Turnstile fails", async () => {
    const bread = await seedProduct({ db, name: "Bread" });
    await seedCapacity({ db, productId: bread, pickupDay, limit: 5 });

    const { status, body } = await send({
      method: "POST",
      path: "/reservations",
      body: reservationBody({ productId: bread, quantity: 1 }),
      context: contextWith({ turnstilePasses: false }),
    });

    expect(status).toBe(403);
    expect(body).toMatchObject({ code: "TURNSTILE_FAILED" });
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(0);
  });

  test("POST /reservations/{code}/cancel cancels, with the code in any case", async () => {
    const bread = await seedProduct({ db, name: "Bread" });
    await seedCapacity({ db, productId: bread, pickupDay, limit: 5 });
    await send({
      method: "POST",
      path: "/reservations",
      body: reservationBody({ productId: bread, quantity: 2 }),
    });

    const { status } = await send({
      method: "POST",
      path: "/reservations/k7m2/cancel",
      body: { turnstileToken: "token" },
    });

    expect(status).toBe(204);
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(0);
  });

  test("POST /reservations/{code}/cancel answers 404 for an unknown code", async () => {
    const { status, body } = await send({
      method: "POST",
      path: "/reservations/QQQQ/cancel",
      body: { turnstileToken: "token" },
    });

    expect(status).toBe(404);
    expect(body).toMatchObject({ code: "NOT_FOUND" });
  });

  test("POST /reservations/{code}/cancel answers 403 when Turnstile fails", async () => {
    const { status } = await send({
      method: "POST",
      path: "/reservations/K7M2/cancel",
      body: { turnstileToken: "token" },
      context: contextWith({ turnstilePasses: false }),
    });

    expect(status).toBe(403);
  });

  test("POST /reservations answers 400 on invalid input", async () => {
    const bread = await seedProduct({ db, name: "Bread" });

    const { status } = await send({
      method: "POST",
      path: "/reservations",
      body: { ...reservationBody({ productId: bread, quantity: 1 }), phone: "call me" },
    });

    expect(status).toBe(400);
  });
});
