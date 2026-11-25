import { oc } from "@orpc/contract";
import { z } from "zod";
import { capacityBelowReserved, notFound, unauthorized } from "./errors.ts";
import {
  capacityInputSchema,
  codeSchema,
  dayCapacitySchema,
  pickupDaySchema,
  pickupListSchema,
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
  capacity: oc
    .route({
      method: "GET",
      path: "/staff/capacity",
      summary: "Each product's capacity and what is reserved for a pickup day",
    })
    .input(pickupDayInputSchema)
    .output(dayCapacitySchema)
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
