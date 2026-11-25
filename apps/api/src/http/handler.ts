import { type Availability, contract, type ReservationInput } from "@acme-bakery/contracts";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { implement } from "@orpc/server";
import { cancelReservation } from "../commands/cancel-reservation.ts";
import type { ReservationWriteStore } from "../commands/ports.ts";
import { reserveItems } from "../commands/reserve-items.ts";
import { getAvailability } from "../queries/availability.ts";
import type { ReservationReadStore } from "../queries/ports.ts";
import type { CutoffConfig } from "../rules/cutoff.ts";

export type ApiContext = {
  writeStore: ReservationWriteStore;
  /** Through the cached Hyperdrive: a stale read is caught by the 409 on submit. */
  readStore: ReservationReadStore;
  /** Uncached, for the availability a 409 sends back. */
  freshReadStore: ReservationReadStore;
  cutoff: CutoffConfig;
  now: () => Date;
  generateCode: () => string;
  verifyTurnstile: (input: { token: string }) => Promise<boolean>;
  isStaff: () => Promise<boolean>;
};

const implementedContract = {
  customer: {
    availability: contract.customer.availability,
    reserve: contract.customer.reserve,
    cancel: contract.customer.cancel,
  },
  staff: {
    reserve: contract.staff.reserve,
    cancel: contract.staff.cancel,
  },
};

const api = implement(implementedContract).$context<ApiContext>();

type ReserveErrors = {
  CAPACITY_EXCEEDED: (options: { data: Availability }) => Error;
  RESERVATIONS_CLOSED: () => Error;
};

/** Customers and staff reserve alike once Turnstile or the session has passed. */
const reserveOrThrow = async ({
  context,
  reservation,
  errors,
}: {
  context: ApiContext;
  reservation: ReservationInput;
  errors: ReserveErrors;
}) => {
  const { writeStore, freshReadStore, cutoff, now, generateCode } = context;
  const outcome = await reserveItems({
    store: writeStore,
    now: now(),
    cutoff,
    generateCode,
    reservation,
  });
  if (outcome.ok) return outcome.value;
  switch (outcome.failure) {
    case "RESERVATIONS_CLOSED":
      throw errors.RESERVATIONS_CLOSED();
    case "CAPACITY_EXCEEDED": {
      const { pickupDay } = reservation;
      const availability = await getAvailability({ store: freshReadStore, cutoff, pickupDay });
      throw errors.CAPACITY_EXCEEDED({ data: availability });
    }
    default:
      throw outcome satisfies never;
  }
};

const router = api.router({
  customer: {
    availability: api.customer.availability.handler(
      ({ input: { pickupDay }, context: { readStore, cutoff } }) =>
        getAvailability({ store: readStore, cutoff, pickupDay }),
    ),
    reserve: api.customer.reserve.handler(async ({ input, context, errors }) => {
      const { turnstileToken, ...reservation } = input;
      if (!(await context.verifyTurnstile({ token: turnstileToken })))
        throw errors.TURNSTILE_FAILED();

      return reserveOrThrow({ context, reservation, errors });
    }),
    cancel: api.customer.cancel.handler(async ({ input, context, errors }) => {
      const { code, turnstileToken } = input;
      const { writeStore, cutoff, now, verifyTurnstile } = context;
      if (!(await verifyTurnstile({ token: turnstileToken }))) throw errors.TURNSTILE_FAILED();

      const outcome = await cancelReservation({
        store: writeStore,
        now: now(),
        cutoff,
        code,
        cancelledBy: "customer",
      });
      if (outcome.ok) return;
      switch (outcome.failure) {
        case "NOT_FOUND":
          throw errors.NOT_FOUND();
        case "RESERVATIONS_CLOSED":
          throw errors.RESERVATIONS_CLOSED();
        default:
          throw outcome satisfies never;
      }
    }),
  },
  staff: {
    reserve: api.staff.reserve.handler(async ({ input: reservation, context, errors }) => {
      if (!(await context.isStaff())) throw errors.UNAUTHORIZED();

      return reserveOrThrow({ context, reservation, errors });
    }),
    cancel: api.staff.cancel.handler(async ({ input: { code }, context, errors }) => {
      const { writeStore, cutoff, now, isStaff } = context;
      if (!(await isStaff())) throw errors.UNAUTHORIZED();

      const outcome = await cancelReservation({
        store: writeStore,
        now: now(),
        cutoff,
        code,
        cancelledBy: "staff",
      });
      if (outcome.ok) return;
      switch (outcome.failure) {
        case "NOT_FOUND":
          throw errors.NOT_FOUND();
        case "RESERVATIONS_CLOSED":
          throw new Error("Staff cancel regardless of the cutoff");
        default:
          throw outcome satisfies never;
      }
    }),
  },
});

export const createApiHandler = () => new OpenAPIHandler(router);
