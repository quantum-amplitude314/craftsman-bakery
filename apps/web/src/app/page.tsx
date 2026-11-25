import Link from "next/link";
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
    <>
      {/* Full width behind the fixed header; the fades keep the wordmark readable and blend into
          the page. */}
      <div className="relative h-64 sm:h-72 lg:h-80">
        {/* biome-ignore lint/performance/noImgElement: the Worker has no image optimizer; the AVIFs are encoded ahead of time. */}
        <img
          src="/hero-1344-v1.avif"
          srcSet="/hero-1344-v1.avif 1344w, /hero-1920-v1.avif 1920w"
          sizes="100vw"
          alt=""
          width={1344}
          height={560}
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover object-[center_45%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-background/85 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent"
        />
      </div>
      <section className="relative mx-auto -mt-6 max-w-2xl space-y-6 px-4 pb-12 lg:max-w-5xl">
        <div className="space-y-1">
          <h1 className="font-heading font-semibold text-3xl">Pickup {formatDay(pickupDay)}</h1>
          <p className="text-muted-foreground">
            Reservations close {formatWallClock(availability.closesAt)}.
          </p>
        </div>
        <ReservationForm availability={availability} />
        <p className="text-center text-muted-foreground text-sm">
          Have a code?{" "}
          <Link href="/cancel" className="text-primary underline underline-offset-4">
            Cancel a reservation
          </Link>
        </p>
      </section>
    </>
  );
}
