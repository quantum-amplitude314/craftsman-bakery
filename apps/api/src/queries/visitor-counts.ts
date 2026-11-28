import type { ReservationReadStore } from "./ports.ts";

export const getVisitorCounts = ({ store }: { store: ReservationReadStore }) =>
  store.latestVisitorCounts();
