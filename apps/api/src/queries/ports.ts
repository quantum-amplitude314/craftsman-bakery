import type {
  Availability,
  DayCapacity,
  PickupList,
  VisitorCounts,
} from "@craftsman-bakery/contracts";
import type { ProductForAdvice } from "./demand-advisor.ts";

export interface ReservationReadStore {
  availableOn(input: { pickupDay: string }): Promise<Availability["products"]>;
  capacityOn(input: { pickupDay: string }): Promise<DayCapacity["products"]>;
  adviceInputsOn(input: { pickupDay: string; recentBakes: number }): Promise<ProductForAdvice[]>;
  pickupListOn(input: { pickupDay: string }): Promise<PickupList["reservations"]>;
  latestVisitorCounts(): Promise<VisitorCounts | null>;
}
