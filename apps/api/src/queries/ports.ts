import type { Availability } from "@acme-bakery/contracts";

export interface ReservationReadStore {
  availableOn(input: { pickupDay: string }): Promise<Availability["products"]>;
}
