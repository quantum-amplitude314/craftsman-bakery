import { oc } from "@orpc/contract";
import { z } from "zod";
import { capacityExceeded, notFound, reservationsClosed, turnstileFailed } from "./errors.ts";
import {
  availabilitySchema,
  codeSchema,
  pickupDaySchema,
  reservationInputSchema,
  reservationReceiptSchema,
} from "./schemas.ts";

const turnstileSchema = z.object({ turnstileToken: z.string().min(1) });

export const customerContract = {
  availability: oc
    .route({
      method: "GET",
      path: "/availability",
      summary: "What can still be reserved for a pickup day",
    })
    .input(z.object({ pickupDay: pickupDaySchema }))
    .output(availabilitySchema),
  reserve: oc
    .route({
      method: "POST",
      path: "/reservations",
      successStatus: 201,
      summary: "Reserve items for a pickup day, all or nothing",
    })
    .input(reservationInputSchema.extend(turnstileSchema.shape))
    .output(reservationReceiptSchema)
    .errors({ ...capacityExceeded, ...reservationsClosed, ...turnstileFailed }),
  cancel: oc
    .route({
      method: "POST",
      path: "/reservations/{code}/cancel",
      successStatus: 204,
      summary: "Cancel a reservation by its code, until the cutoff",
    })
    .input(z.object({ code: codeSchema }).extend(turnstileSchema.shape))
    .errors({ ...notFound, ...reservationsClosed, ...turnstileFailed }),
};
