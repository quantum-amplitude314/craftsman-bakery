import { connection } from "next/server";
import { ReservationForm } from "@/components/reservation-form";
import { apiClient } from "@/lib/api";
import { formatDay, formatWallClock } from "@/lib/bakery-day";

function ReservationHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h1 className="font-heading font-semibold text-3xl">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function ReservationSkeleton() {
  return (
    <>
      <ReservationHeading title="Next pickup" subtitle="Loading what is left…" />
      <div aria-hidden="true" className="h-96 animate-pulse rounded-4xl bg-card" />
    </>
  );
}

export async function Reservation() {
  await connection();
  const availability = await apiClient.customer.availability({});
  const { pickupDay, closesAt } = availability;

  return (
    <>
      <ReservationHeading
        title={`Pickup ${formatDay(pickupDay)}`}
        subtitle={`Reservations close ${formatWallClock(closesAt)}.`}
      />
      <ReservationForm key={crypto.randomUUID()} availability={availability} />
    </>
  );
}
