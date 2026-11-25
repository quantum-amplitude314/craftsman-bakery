import { connection } from "next/server";
import { ReservationForm } from "@/components/reservation-form";
import { apiClient } from "@/lib/api";
import { formatDay, formatWallClock, tomorrowIn } from "@/lib/bakery-day";
import { getEnv } from "@/lib/env";

export default async function HomePage() {
  await connection();
  const { BAKERY_TIME_ZONE: timeZone } = await getEnv();
  const pickupDay = tomorrowIn({ now: new Date(), timeZone });
  const availability = await apiClient.customer.availability({ pickupDay });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl">Pickup {formatDay(pickupDay)}</h1>
        <p className="text-stone-600">
          Reservations close {formatWallClock(availability.closesAt)}.
        </p>
      </div>
      <ReservationForm availability={availability} />
    </section>
  );
}
