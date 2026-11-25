import { contract } from "@acme-bakery/contracts";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { implement } from "@orpc/server";
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
};

const implementedContract = {
  customer: {
    availability: contract.customer.availability,
    reserve: contract.customer.reserve,
  },
};

const api = implement(implementedContract).$context<ApiContext>();

const router = api.router({
  customer: {
    availability: api.customer.availability.handler(
      ({ input: { pickupDay }, context: { readStore, cutoff } }) =>
        getAvailability({ store: readStore, cutoff, pickupDay }),
    ),
    reserve: api.customer.reserve.handler(async ({ input, context, errors }) => {
      const { turnstileToken, ...reservation } = input;
      const { writeStore, freshReadStore, cutoff, now, generateCode, verifyTurnstile } = context;
      if (!(await verifyTurnstile({ token: turnstileToken }))) throw errors.TURNSTILE_FAILED();

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
    }),
  },
});

export const createApiHandler = () => new OpenAPIHandler(router);
