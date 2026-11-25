import type { Availability, DayCapacity, PickupList } from "@craftsman-bakery/contracts";

export interface ReservationReadStore {
  availableOn(input: { pickupDay: string }): Promise<Availability["products"]>;
  capacityOn(input: { pickupDay: string }): Promise<DayCapacity["products"]>;
  pickupListOn(input: { pickupDay: string }): Promise<PickupList["reservations"]>;
}
