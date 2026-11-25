import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
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

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
};

/** Better Auth tables: staff accounts and their sessions. */
export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    ...timestamps,
  },
  (table) => [index("session_user_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text().notNull(),
    providerId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (table) => [index("account_user_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
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
