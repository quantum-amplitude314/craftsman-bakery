import type { CapacityInput, ReservationInput } from "@craftsman-bakery/contracts";

export type ReserveResult = "RESERVED" | "CAPACITY_EXCEEDED" | "CODE_TAKEN";
export type SetCapacityResult = "SET" | "BELOW_RESERVED" | "UNKNOWN_PRODUCT";

export interface ReservationWriteStore {
  /** All or nothing in one transaction; capacity rows are locked in product id order. */
  reserveWithinCapacity(input: ReservationInput & { code: string }): Promise<ReserveResult>;
  reservationStateOf(input: {
    code: string;
  }): Promise<{ pickupDay: string; pickedUp: boolean } | null>;
  /** False when the reservation is gone. */
  setPickedUp(input: { code: string; pickedUpAt: Date | null }): Promise<boolean>;
  /** Deletes the reservation and frees its capacity in one transaction. False when already gone. */
  cancel(input: { code: string }): Promise<boolean>;
  /** Upserts, refusing atomically to go below what is reserved. */
  setCapacity(input: CapacityInput): Promise<SetCapacityResult>;
}
