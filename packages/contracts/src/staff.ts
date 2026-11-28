import { oc } from "@orpc/contract";
import { z } from "zod";
import { capacityBelowReserved, notFound, notPickupDay, pickedUp, unauthorized } from "./errors.ts";
import {
  capacityAdviceSchema,
  capacityInputSchema,
  codeSchema,
  dayCapacitySchema,
  pickupDaySchema,
  pickupListSchema,
  visitorCountsSchema,
} from "./schemas.ts";

const pickupDayInputSchema = z.object({ pickupDay: pickupDaySchema });

export const staffContract = {
  cancel: oc
    .route({
      method: "POST",
      path: "/staff/reservations/{code}/cancel",
      successStatus: 204,
      summary: "Cancel a reservation by its code, also after the cutoff",
    })
    .input(z.object({ code: codeSchema }))
    .errors({ ...notFound, ...pickedUp, ...unauthorized }),
  pickup: oc
    .route({
      method: "PUT",
      path: "/staff/reservations/{code}/pickup",
      successStatus: 204,
      summary: "Mark a reservation picked up at the counter, or undo it, on its pickup day",
    })
    .input(z.object({ code: codeSchema, pickedUp: z.boolean() }))
    .errors({ ...notFound, ...notPickupDay, ...unauthorized }),
  setCapacity: oc
    .route({
      method: "PUT",
      path: "/staff/capacity/{pickupDay}/{productId}",
      successStatus: 204,
      summary: "Set how many of a product can be reserved for a pickup day",
    })
    .input(capacityInputSchema)
    .errors({ ...capacityBelowReserved, ...notFound, ...unauthorized }),
  capacity: oc
    .route({
      method: "GET",
      path: "/staff/capacity",
      summary: "Each product's capacity and what is reserved for a pickup day",
    })
    .input(pickupDayInputSchema)
    .output(dayCapacitySchema)
    .errors(unauthorized),
  capacityAdvice: oc
    .route({
      method: "GET",
      path: "/staff/capacity-advice",
      summary: "The advisor's suggested capacity per product for a pickup day",
    })
    .input(pickupDayInputSchema)
    .output(capacityAdviceSchema)
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
  visitorCounts: oc
    .route({
      method: "GET",
      path: "/staff/visitor-counts",
      summary: "The latest count of the demo's visitors by kind; null before the first count",
    })
    .output(visitorCountsSchema.nullable())
    .errors(unauthorized),
};
