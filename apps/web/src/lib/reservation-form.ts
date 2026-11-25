import {
  type Availability,
  availabilitySchema,
  type ReservationInput,
  type ReservationReceipt,
  reservationInputSchema,
} from "@acme-bakery/contracts";
import { ORPCError } from "@orpc/client";
import { z } from "zod";

const QUANTITY_FIELD_PREFIX = "quantity:";
/** The hidden input Turnstile adds to the form it renders in. */
const TURNSTILE_FIELD = "cf-turnstile-response";
const FORM_FIELDS = ["name", "phone", "items", "turnstile"] as const;

export type FormField = (typeof FORM_FIELDS)[number];

export type ReserveOutcome =
  | { status: "editing" }
  | { status: "invalid"; invalidFields: FormField[] }
  | { status: "reserved"; receipt: ReservationReceipt }
  | { status: "no-longer-fits"; productNames: string[]; availability: Availability }
  | { status: "closed" }
  | { status: "turnstile-failed" }
  | { status: "failed" };

/** `attempt` counts the submissions, so the Turnstile widget remounts for a fresh token. */
export type ReserveState = ReserveOutcome & { attempt: number };

export const quantityFieldOf = (productId: string) => `${QUANTITY_FIELD_PREFIX}${productId}`;

const itemsOf = (formData: FormData) =>
  [...formData.entries()].flatMap(([field, value]) => {
    if (!field.startsWith(QUANTITY_FIELD_PREFIX) || typeof value !== "string") return [];
    const quantity = Number(value);
    const item = { productId: field.slice(QUANTITY_FIELD_PREFIX.length), quantity };

    return quantity > 0 ? [item] : [];
  });

const formSchema = reservationInputSchema.extend({ turnstileToken: z.string().min(1) });

export const readReservationForm = (formData: FormData) => {
  const parsed = formSchema.safeParse({
    pickupDay: formData.get("pickupDay"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    items: itemsOf(formData),
    turnstileToken: formData.get(TURNSTILE_FIELD) ?? "",
  });
  if (parsed.success) {
    const valid = { status: "valid" as const, input: parsed.data };

    return valid;
  }

  const { fieldErrors } = z.flattenError(parsed.error);
  const fieldsWithErrors = {
    name: fieldErrors.name,
    phone: fieldErrors.phone,
    items: fieldErrors.items,
    turnstile: fieldErrors.turnstileToken,
  };
  const invalid = {
    status: "invalid" as const,
    invalidFields: FORM_FIELDS.filter((field) => fieldsWithErrors[field] !== undefined),
  };

  return invalid;
};

const productsThatNoLongerFit = ({
  items,
  availability,
}: {
  items: ReservationInput["items"];
  availability: Availability;
}) =>
  availability.products
    .filter(({ productId, available }) =>
      items.some((item) => item.productId === productId && item.quantity > available),
    )
    .map(({ name }) => name);

export const reserveFailureOf = ({
  error,
  items,
}: {
  error: unknown;
  items: ReservationInput["items"];
}): ReserveOutcome => {
  if (!(error instanceof ORPCError)) return { status: "failed" };

  const { code, data } = error;
  if (code === "RESERVATIONS_CLOSED") return { status: "closed" };
  if (code === "TURNSTILE_FAILED") return { status: "turnstile-failed" };
  const availability = availabilitySchema.safeParse(data);
  if (code !== "CAPACITY_EXCEEDED" || !availability.success) return { status: "failed" };

  const noLongerFits: ReserveOutcome = {
    status: "no-longer-fits",
    productNames: productsThatNoLongerFit({ items, availability: availability.data }),
    availability: availability.data,
  };

  return noLongerFits;
};
