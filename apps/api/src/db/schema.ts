import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const product = pgTable("product", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
});

/** One row per product and pickup day; `reserved` moves by atomic conditional updates. */
export const capacity = pgTable(
  "capacity",
  {
    productId: uuid()
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    pickupDay: date().notNull(),
    capacity: integer().notNull(),
    reserved: integer().notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.pickupDay] }),
    check(
      "capacity_reserved_within",
      sql`0 <= ${table.reserved} and ${table.reserved} <= ${table.capacity}`,
    ),
  ],
);

export const reservation = pgTable("reservation", {
  code: text().primaryKey(),
  pickupDay: date().notNull(),
  name: text().notNull(),
  phone: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const reservationItem = pgTable(
  "reservation_item",
  {
    reservationCode: text()
      .notNull()
      .references(() => reservation.code, { onDelete: "cascade" }),
    productId: uuid()
      .notNull()
      .references(() => product.id),
    quantity: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.reservationCode, table.productId] }),
    check("reservation_item_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

/** What is left of each product offered on a pickup day. */
export const availability = pgView("availability", {
  productId: uuid().notNull(),
  name: text().notNull(),
  pickupDay: date().notNull(),
  available: integer().notNull(),
}).as(
  sql`select ${capacity.productId}, ${product.name}, ${capacity.pickupDay}, ${capacity.capacity} - ${capacity.reserved} as available from ${capacity} inner join ${product} on ${product.id} = ${capacity.productId}`,
);
