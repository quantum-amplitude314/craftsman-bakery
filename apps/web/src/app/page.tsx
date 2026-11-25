import { connection } from "next/server";
import { apiClient } from "@/lib/api";
import { formatDay, formatWallClock, tomorrowIn } from "@/lib/bakery-day";
import { getEnv } from "@/lib/env";

export default async function HomePage() {
  await connection();
  const { BAKERY_TIME_ZONE: timeZone } = await getEnv();
  const pickupDay = tomorrowIn({ now: new Date(), timeZone });
  const { products, closesAt } = await apiClient.customer.availability({ pickupDay });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl">Pickup {formatDay(pickupDay)}</h1>
        <p className="text-stone-600">Reservations close {formatWallClock(closesAt)}.</p>
      </div>
      <ul className="divide-y divide-crust/15 rounded-lg bg-white/70">
        {products.map(({ productId, name, available }) => (
          <li key={productId} className="flex items-center justify-between px-4 py-3">
            <span>{name}</span>
            <span className={available > 0 ? "text-stone-600" : "text-crust"}>
              {available > 0 ? `${available} left` : "Sold out"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
