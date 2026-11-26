import { availabilitySchema } from "./schemas.ts";

export const capacityExceeded = {
  CAPACITY_EXCEEDED: {
    status: 409,
    message: "Some items no longer fit; nothing was reserved",
    data: availabilitySchema,
  },
};
export const reservationsClosed = {
  RESERVATIONS_CLOSED: { status: 422, message: "Reservations for this day are closed" },
};
export const turnstileFailed = {
  TURNSTILE_FAILED: { status: 403, message: "The Turnstile check failed" },
};
export const capacityBelowReserved = {
  CAPACITY_BELOW_RESERVED: {
    status: 409,
    message: "Capacity cannot go below what is already reserved",
  },
};
export const pickedUp = {
  PICKED_UP: { status: 409, message: "The reservation was picked up already" },
};
export const notPickupDay = {
  NOT_PICKUP_DAY: { status: 422, message: "Pickups are marked on the pickup day only" },
};
export const notFound = { NOT_FOUND: { message: "Not found" } };
export const unauthorized = { UNAUTHORIZED: { message: "Staff sign-in required" } };
