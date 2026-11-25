import type { ReservationInput } from "@acme-bakery/contracts";

export type ReserveResult = "RESERVED" | "CAPACITY_EXCEEDED" | "CODE_TAKEN";

export interface ReservationWriteStore {
  /** All or nothing in one transaction; capacity rows are locked in product id order. */
  reserveWithinCapacity(input: ReservationInput & { code: string }): Promise<ReserveResult>;
  pickupDayOf(input: { code: string }): Promise<string | null>;
  /** Deletes the reservation and frees its capacity in one transaction. False when already gone. */
  cancel(input: { code: string }): Promise<boolean>;
}
