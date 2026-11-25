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

/** What the bakery baked per product and day, from its own records. */
export const bakeHistory = pgTable(
  "bake_history",
  {
    productId: uuid()
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    day: date().notNull(),
    baked: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.day] }),
    check("bake_history_baked_non_negative", sql`${table.baked} >= 0`),
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

/** Share of a typical bake the bakery accepts as reservations. */
const RESERVABLE_SHARE = 0.3;
/** How many of the latest same weekdays make the typical bake. */
const RECENT_WEEKDAYS = 4;

/** Capacity for a day nobody set: a share of the recent average bake on that weekday (ISO, Monday 1). */
export const defaultCapacity = pgView("default_capacity", {
  productId: uuid().notNull(),
  weekday: integer().notNull(),
  capacity: integer().notNull(),
}).as(
  sql`select product_id, weekday, round(avg(baked) * ${sql.raw(String(RESERVABLE_SHARE))})::int as capacity
  from (
    select ${bakeHistory.productId}, ${bakeHistory.baked}, extract(isodow from ${bakeHistory.day})::int as weekday,
      row_number() over (partition by ${bakeHistory.productId}, extract(isodow from ${bakeHistory.day}) order by ${bakeHistory.day} desc) as recency
    from ${bakeHistory}
  ) recent
  where recency <= ${sql.raw(String(RECENT_WEEKDAYS))}
  group by product_id, weekday`,
);
