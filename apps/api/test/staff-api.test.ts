import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createApiTestContext, sendApi } from "./api.ts";
import { createTestDb, reservedOf, resetTables, seedCapacity, seedProduct } from "./helpers.ts";

const { db, close } = createTestDb();
const pickupDay = "2026-12-24";
const beforeCutoff = "2026-12-23T12:00:00Z";
const afterCutoff = "2026-12-23T17:00:00Z";

const staff = ({ now = beforeCutoff }: { now?: string } = {}) =>
  createApiTestContext({ db, isStaff: true, turnstilePasses: false, now });

const phoneReservation = ({ productId }: { productId: string }) => ({
  pickupDay,
  name: "Bob",
  phone: "+420 602 000 111",
  items: [{ productId, quantity: 2 }],
});

const seedBread = async () => {
  const bread = await seedProduct({ db, name: "Bread" });
  await seedCapacity({ db, productId: bread, pickupDay, limit: 5 });

  return bread;
};

beforeEach(() => resetTables({ db }));
afterAll(() => close());

describe("staff API", () => {
  test("staff routes answer 401 without a staff session", async () => {
    const bread = await seedBread();
    const visitor = createApiTestContext({ db });

    const reserve = await sendApi({
      method: "POST",
      path: "/staff/reservations",
      body: phoneReservation({ productId: bread }),
      context: visitor,
    });
    const cancel = await sendApi({
      method: "POST",
      path: "/staff/reservations/K7M2/cancel",
      context: visitor,
    });

    expect([reserve.status, cancel.status]).toEqual([401, 401]);
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(0);
  });

  test("staff enter a phone reservation, no Turnstile", async () => {
    const bread = await seedBread();

    const { status, body } = await sendApi({
      method: "POST",
      path: "/staff/reservations",
      body: phoneReservation({ productId: bread }),
      context: staff(),
    });

    expect(status).toBe(201);
    expect(body).toEqual({ code: "K7M2", pickupDay });
  });

  test("phone reservations close at the cutoff too", async () => {
    const bread = await seedBread();

    const { status } = await sendApi({
      method: "POST",
      path: "/staff/reservations",
      body: phoneReservation({ productId: bread }),
      context: staff({ now: afterCutoff }),
    });

    expect(status).toBe(422);
  });

  test("staff cancel after the cutoff and the capacity is free again", async () => {
    const bread = await seedBread();
    await sendApi({
      method: "POST",
      path: "/staff/reservations",
      body: phoneReservation({ productId: bread }),
      context: staff(),
    });

    const { status } = await sendApi({
      method: "POST",
      path: "/staff/reservations/K7M2/cancel",
      context: staff({ now: afterCutoff }),
    });

    expect(status).toBe(204);
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(0);
  });

  test("staff cancelling an unknown code get 404", async () => {
    const { status } = await sendApi({
      method: "POST",
      path: "/staff/reservations/QQQQ/cancel",
      context: staff(),
    });

    expect(status).toBe(404);
  });
});
