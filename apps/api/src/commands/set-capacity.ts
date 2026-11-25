import type { CapacityInput } from "@craftsman-bakery/contracts";
import { fail, succeed } from "../outcome.ts";
import type { ReservationWriteStore } from "./ports.ts";

export const setCapacity = async ({
  store,
  capacity,
}: {
  store: ReservationWriteStore;
  capacity: CapacityInput;
}) => {
  const result = await store.setCapacity(capacity);
  switch (result) {
    case "SET":
      return succeed(capacity);
    case "BELOW_RESERVED":
      return fail("CAPACITY_BELOW_RESERVED");
    case "UNKNOWN_PRODUCT":
      return fail("NOT_FOUND");
    default:
      throw result satisfies never;
  }
};
