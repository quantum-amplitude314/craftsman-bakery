import type { Availability, BakeCount, PickupList } from "@acme-bakery/contracts";

export interface ReservationReadStore {
  availableOn(input: { pickupDay: string }): Promise<Availability["products"]>;
  bakeCountOn(input: { pickupDay: string }): Promise<BakeCount["products"]>;
  pickupListOn(input: { pickupDay: string }): Promise<PickupList["reservations"]>;
}
