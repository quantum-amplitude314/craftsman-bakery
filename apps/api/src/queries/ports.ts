import type { Availability, BakeCount, DayCapacity, PickupList } from "@craftsman-bakery/contracts";

export interface ReservationReadStore {
  availableOn(input: { pickupDay: string }): Promise<Availability["products"]>;
  capacityOn(input: { pickupDay: string }): Promise<DayCapacity["products"]>;
  bakeCountOn(input: { pickupDay: string }): Promise<BakeCount["products"]>;
  pickupListOn(input: { pickupDay: string }): Promise<PickupList["reservations"]>;
}
