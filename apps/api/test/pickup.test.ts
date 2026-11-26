import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createApiTestContext, sendApi } from "./api.ts";
import { createTestDb, reservedOf, resetTables, seedCapacity, seedProduct } from "./helpers.ts";

const { db, close } = createTestDb();
const pickupDay = "2026-12-24";
const onPickupDay = "2026-12-24T09:00:00Z";
const dayBefore = "2026-12-23T09:00:00Z";

const staff = ({ now = onPickupDay }: { now?: string } = {}) =>
  createApiTestContext({ db, isStaff: true, now });

const reserveBread = async ({ code, name }: { code: string; name: string }) => {
  const bread = await seedProduct({ db, name: `Bread ${code}` });
  await seedCapacity({ db, productId: bread, pickupDay, limit: 5 });
  await sendApi({
    method: "POST",
    path: "/reservations",
    body: {
      pickupDay,
      name,
      phone: "+420 602 000 111",
      items: [{ productId: bread, quantity: 2 }],
      turnstileToken: "token",
    },
    context: createApiTestContext({ db, now: dayBefore, codes: [code] }),
  });

  return bread;
};

const markPickedUp = ({
  code,
  pickedUp = true,
  context = staff(),
}: {
  code: string;
  pickedUp?: boolean;
  context?: ReturnType<typeof staff>;
}) =>
  sendApi({
    method: "PUT",
    path: `/staff/reservations/${code}/pickup`,
    body: { pickedUp },
    context,
  });

const pickupList = async () => {
  const { body } = await sendApi({
    method: "GET",
    path: `/staff/pickup-list?pickupDay=${pickupDay}`,
    context: staff(),
  });
  const { reservations } = body as { reservations: { code: string; pickedUp: boolean }[] };

  return reservations.map(({ code, pickedUp }) => ({ code, pickedUp }));
};

beforeEach(() => resetTables({ db }));
afterAll(() => close());

describe("pickup", () => {
  test("staff mark a reservation picked up on its day; it moves to the end of the list", async () => {
    await reserveBread({ code: "AAAA", name: "Ada" });
    await reserveBread({ code: "BBBB", name: "Bob" });

    const { status } = await markPickedUp({ code: "AAAA" });

    expect(status).toBe(204);
    expect(await pickupList()).toEqual([
      { code: "BBBB", pickedUp: false },
      { code: "AAAA", pickedUp: true },
    ]);
  });

  test("staff undo a pickup marked by mistake", async () => {
    await reserveBread({ code: "AAAA", name: "Ada" });
    await markPickedUp({ code: "AAAA" });

    const { status } = await markPickedUp({ code: "AAAA", pickedUp: false });

    expect(status).toBe(204);
    expect(await pickupList()).toEqual([{ code: "AAAA", pickedUp: false }]);
  });

  test("only on the pickup day", async () => {
    await reserveBread({ code: "AAAA", name: "Ada" });

    const { status, body } = await markPickedUp({
      code: "AAAA",
      context: staff({ now: dayBefore }),
    });

    expect(status).toBe(422);
    expect(body).toMatchObject({ code: "NOT_PICKUP_DAY" });
  });

  test("answers 404 for an unknown code and 401 without a staff session", async () => {
    const unknown = await markPickedUp({ code: "QQQQ" });
    const visitor = await markPickedUp({ code: "QQQQ", context: createApiTestContext({ db }) });

    expect([unknown.status, visitor.status]).toEqual([404, 401]);
  });

  test("a picked-up reservation can no longer be cancelled, so its capacity stays taken", async () => {
    const bread = await reserveBread({ code: "AAAA", name: "Ada" });
    await markPickedUp({ code: "AAAA" });

    const { status, body } = await sendApi({
      method: "POST",
      path: "/staff/reservations/AAAA/cancel",
      context: staff(),
    });

    expect(status).toBe(409);
    expect(body).toMatchObject({ code: "PICKED_UP" });
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(2);
  });
});
