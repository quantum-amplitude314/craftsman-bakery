import { connection } from "next/server";
import { ReservationForm } from "@/components/reservation-form";
import { apiClient } from "@/lib/api";
import { formatDay, formatWallClock, tomorrowIn } from "@/lib/bakery-day";
import { getEnv } from "@/lib/env";

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
      <ReservationHeading title="Pickup tomorrow" subtitle="Loading what is left…" />
      <div aria-hidden="true" className="h-96 animate-pulse rounded-4xl bg-card" />
    </>
  );
}

export async function Reservation() {
  await connection();
  const { BAKERY_TIME_ZONE: timeZone } = await getEnv();
  const pickupDay = tomorrowIn({ now: new Date(), timeZone });
  const availability = await apiClient.customer.availability({ pickupDay });
  const { closesAt } = availability;

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
