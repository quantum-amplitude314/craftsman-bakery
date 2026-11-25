import { oc } from "@orpc/contract";
import { z } from "zod";
import {
  capacityBelowReserved,
  capacityExceeded,
  notFound,
  reservationsClosed,
  unauthorized,
} from "./errors.ts";
import {
  bakeCountSchema,
  capacityInputSchema,
  codeSchema,
  pickupDaySchema,
  pickupListSchema,
  reservationInputSchema,
  reservationReceiptSchema,
} from "./schemas.ts";

const pickupDayInputSchema = z.object({ pickupDay: pickupDaySchema });

export const staffContract = {
  reserve: oc
    .route({
      method: "POST",
      path: "/staff/reservations",
      successStatus: 201,
      summary: "Enter a phone reservation, all or nothing",
    })
    .input(reservationInputSchema)
    .output(reservationReceiptSchema)
    .errors({ ...capacityExceeded, ...reservationsClosed, ...unauthorized }),
  cancel: oc
    .route({
      method: "POST",
      path: "/staff/reservations/{code}/cancel",
      successStatus: 204,
      summary: "Cancel a reservation by its code, also after the cutoff",
    })
    .input(z.object({ code: codeSchema }))
    .errors({ ...notFound, ...unauthorized }),
  setCapacity: oc
    .route({
      method: "PUT",
      path: "/staff/capacity/{pickupDay}/{productId}",
      successStatus: 204,
      summary: "Set how many of a product can be reserved for a pickup day",
    })
    .input(capacityInputSchema)
    .errors({ ...capacityBelowReserved, ...notFound, ...unauthorized }),
  bakeCount: oc
    .route({
      method: "GET",
      path: "/staff/bake-count",
      summary: "Reserved quantities per product for a pickup day",
    })
    .input(pickupDayInputSchema)
    .output(bakeCountSchema)
    .errors(unauthorized),
  pickupList: oc
    .route({
      method: "GET",
      path: "/staff/pickup-list",
      summary: "Reservations of a pickup day, by code",
    })
    .input(pickupDayInputSchema)
    .output(pickupListSchema)
    .errors(unauthorized),
};
