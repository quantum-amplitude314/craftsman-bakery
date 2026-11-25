import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createApiTestContext, sendApi } from "./api.ts";
import { createTestDb, reservedOf, resetTables, seedCapacity, seedProduct } from "./helpers.ts";

const { db, close } = createTestDb();
const pickupDay = "2026-12-24";
const staff = createApiTestContext({ db, isStaff: true });

const setCapacity = ({
  productId,
  capacity,
  context = staff,
}: {
  productId: string;
  capacity: number;
  context?: typeof staff;
}) =>
  sendApi({
    method: "PUT",
    path: `/staff/capacity/${pickupDay}/${productId}`,
    body: { capacity },
    context,
  });

const availableBread = async () => {
  const { body } = await sendApi({
    method: "GET",
    path: `/availability?pickupDay=${pickupDay}`,
    context: staff,
  });
  const [bread] = (body as { products: { available: number }[] }).products;

  return bread?.available;
};

beforeEach(() => resetTables({ db }));
afterAll(() => close());

describe("set capacity", () => {
  test("offers a product on a day", async () => {
    const bread = await seedProduct({ db, name: "Bread" });

    const { status } = await setCapacity({ productId: bread, capacity: 12 });

    expect(status).toBe(204);
    expect(await availableBread()).toBe(12);
  });

  test("changes a capacity, down to what is reserved", async () => {
    const bread = await seedProduct({ db, name: "Bread" });
    await seedCapacity({ db, productId: bread, pickupDay, limit: 10, reserved: 4 });

    const { status } = await setCapacity({ productId: bread, capacity: 4 });

    expect(status).toBe(204);
    expect(await availableBread()).toBe(0);
  });

  test("refuses a capacity below what is reserved", async () => {
    const bread = await seedProduct({ db, name: "Bread" });
    await seedCapacity({ db, productId: bread, pickupDay, limit: 10, reserved: 4 });

    const { status, body } = await setCapacity({ productId: bread, capacity: 3 });

    expect(status).toBe(409);
    expect(body).toMatchObject({ code: "CAPACITY_BELOW_RESERVED" });
    expect(await availableBread()).toBe(6);
    expect(await reservedOf({ db, productId: bread, pickupDay })).toBe(4);
  });

  test("an unknown product is not found", async () => {
    const { status } = await setCapacity({ productId: crypto.randomUUID(), capacity: 5 });

    expect(status).toBe(404);
  });

  test("answers 401 without a staff session", async () => {
    const bread = await seedProduct({ db, name: "Bread" });

    const { status } = await setCapacity({
      productId: bread,
      capacity: 5,
      context: createApiTestContext({ db }),
    });

    expect(status).toBe(401);
  });
});
