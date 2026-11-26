import { type Availability, contract, type ReservationInput } from "@craftsman-bakery/contracts";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { implement } from "@orpc/server";
import { cancelReservation } from "../commands/cancel-reservation.ts";
import type { ReservationWriteStore } from "../commands/ports.ts";
import { reserveItems } from "../commands/reserve-items.ts";
import { setCapacity } from "../commands/set-capacity.ts";
import { getAvailability } from "../queries/availability.ts";
import { getCapacityAdvice } from "../queries/capacity-advice.ts";
import { getDayCapacity } from "../queries/day-capacity.ts";
import type { DemandAdvisor } from "../queries/demand-advisor.ts";
import { getPickupList } from "../queries/pickup-list.ts";
import type { ReservationReadStore } from "../queries/ports.ts";
import { type CutoffConfig, nextOpenPickupDay } from "../rules/cutoff.ts";

export type ApiContext = {
  writeStore: ReservationWriteStore;
  /** Through the cached Hyperdrive: a stale read is caught by the 409 on submit. */
  readStore: ReservationReadStore;
  /** Uncached: the availability a 409 sends back, and staff reads. */
  freshReadStore: ReservationReadStore;
  cutoff: CutoffConfig;
  now: () => Date;
  generateCode: () => string;
  verifyTurnstile: (input: { token: string }) => Promise<boolean>;
  isStaff: () => Promise<boolean>;
  demandAdvisor: DemandAdvisor;
};

const implementedContract = {
  customer: {
    availability: contract.customer.availability,
    reserve: contract.customer.reserve,
    cancel: contract.customer.cancel,
  },
  staff: {
    cancel: contract.staff.cancel,
    capacity: contract.staff.capacity,
    capacityAdvice: contract.staff.capacityAdvice,
    pickupList: contract.staff.pickupList,
    setCapacity: contract.staff.setCapacity,
  },
};

const api = implement(implementedContract).$context<ApiContext>();

type ReserveErrors = {
  CAPACITY_EXCEEDED: (options: { data: Availability }) => Error;
  RESERVATIONS_CLOSED: () => Error;
};

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
    availability: api.customer.availability.handler(({ input, context }) => {
      const { readStore, cutoff, now } = context;
      const { pickupDay = nextOpenPickupDay({ now: now(), cutoff }) } = input;

      return getAvailability({ store: readStore, cutoff, pickupDay });
    }),
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
    capacity: api.staff.capacity.handler(async ({ input: { pickupDay }, context, errors }) => {
      const { isStaff, freshReadStore } = context;
      if (!(await isStaff())) throw errors.UNAUTHORIZED();

      return getDayCapacity({ store: freshReadStore, pickupDay });
    }),
    capacityAdvice: api.staff.capacityAdvice.handler(
      async ({ input: { pickupDay }, context, errors }) => {
        const { isStaff, freshReadStore, demandAdvisor, cutoff, now } = context;
        if (!(await isStaff())) throw errors.UNAUTHORIZED();

        return getCapacityAdvice({
          store: freshReadStore,
          advisor: demandAdvisor,
          pickupDay,
          cutoff,
          now: now(),
        });
      },
    ),
    pickupList: api.staff.pickupList.handler(async ({ input: { pickupDay }, context, errors }) => {
      const { isStaff, freshReadStore } = context;
      if (!(await isStaff())) throw errors.UNAUTHORIZED();

      return getPickupList({ store: freshReadStore, pickupDay });
    }),
    setCapacity: api.staff.setCapacity.handler(async ({ input, context, errors }) => {
      const { isStaff, writeStore } = context;
      if (!(await isStaff())) throw errors.UNAUTHORIZED();

      const outcome = await setCapacity({ store: writeStore, capacity: input });
      if (outcome.ok) return;
      switch (outcome.failure) {
        case "CAPACITY_BELOW_RESERVED":
          throw errors.CAPACITY_BELOW_RESERVED();
        case "NOT_FOUND":
          throw errors.NOT_FOUND();
        default:
          throw outcome satisfies never;
      }
    }),
  },
});

export const createApiHandler = () => new OpenAPIHandler(router);
