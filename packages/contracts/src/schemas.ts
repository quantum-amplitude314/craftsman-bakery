import { z } from "zod";

/** No look-alikes: I, L, O, Z, 0 and 1 are left out. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXY23456789";
export const CODE_LENGTH = 4;
export const NAME_MAX_LENGTH = 100;

export const pickupDaySchema = z.iso.date();
export const productIdSchema = z.uuid();
export const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`), "Not a reservation code");

export const reservationItemSchema = z.object({
  productId: productIdSchema,
  quantity: z.int().positive(),
});

export const reservationInputSchema = z.object({
  pickupDay: pickupDaySchema,
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{6,20}$/, "Not a phone number"),
  items: z
    .array(reservationItemSchema)
    .min(1)
    .refine(
      (items) => new Set(items.map(({ productId }) => productId)).size === items.length,
      "Each product once",
    ),
});
export type ReservationInput = z.infer<typeof reservationInputSchema>;

export const reservationReceiptSchema = z.object({
  code: codeSchema,
  pickupDay: pickupDaySchema,
});
export type ReservationReceipt = z.infer<typeof reservationReceiptSchema>;

export const availabilitySchema = z.object({
  pickupDay: pickupDaySchema,
  /** On the bakery's clock, like 2026-12-23T18:00. */
  closesAt: z.iso.datetime({ local: true }),
  products: z.array(
    z.object({
      productId: productIdSchema,
      name: z.string(),
      description: z.string(),
      available: z.int().nonnegative(),
    }),
  ),
});
export type Availability = z.infer<typeof availabilitySchema>;

const productQuantitySchema = z.object({
  productId: productIdSchema,
  name: z.string(),
  quantity: z.int().positive(),
});

export const pickupListSchema = z.object({
  pickupDay: pickupDaySchema,
  reservations: z.array(
    z.object({
      code: codeSchema,
      name: z.string(),
      phone: z.string(),
      items: z.array(productQuantitySchema),
    }),
  ),
});
export type PickupList = z.infer<typeof pickupListSchema>;

export const capacityInputSchema = z.object({
  pickupDay: pickupDaySchema,
  productId: productIdSchema,
  capacity: z.int().nonnegative(),
});
export type CapacityInput = z.infer<typeof capacityInputSchema>;

export const dayCapacitySchema = z.object({
  pickupDay: pickupDaySchema,
  products: z.array(
    z.object({
      productId: productIdSchema,
      name: z.string(),
      /** Set for the day, else the weekday default; null when the product is not offered. */
      capacity: z.int().nonnegative().nullable(),
      reserved: z.int().nonnegative(),
    }),
  ),
});
export type DayCapacity = z.infer<typeof dayCapacitySchema>;
