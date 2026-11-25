import type { BakeCount, DayCapacity, PickupList } from "@craftsman-bakery/contracts";
import { ORPCError } from "@orpc/client";
import Link from "next/link";
import { connection } from "next/server";
import { CancelReservationButton } from "@/components/cancel-reservation-button";
import { CapacityRow } from "@/components/capacity-row";
import { SessionExpired } from "@/components/session-expired";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { formatDay, todayIn, tomorrowIn } from "@/lib/bakery-day";
import { getEnv } from "@/lib/env";

const DAY_CHOICES = [
  { choice: "today", label: "Today" },
  { choice: "tomorrow", label: "Tomorrow" },
] as const;

type DayChoice = (typeof DAY_CHOICES)[number]["choice"];

export type StaffDaySearchParams = Promise<{ day?: string | string[] }>;

const dayChoiceOf = (day: unknown): DayChoice => (day === "today" ? "today" : "tomorrow");

const pickupDayOf = async (choice: DayChoice) => {
  await connection();
  const { BAKERY_TIME_ZONE: timeZone } = await getEnv();
  const now = new Date();
  const pickupDay = choice === "today" ? todayIn({ now, timeZone }) : tomorrowIn({ now, timeZone });

  return pickupDay;
};

const loadDay = async (pickupDay: string) => {
  const [bakeCount, pickupList, dayCapacity] = await Promise.all([
    apiClient.staff.bakeCount({ pickupDay }),
    apiClient.staff.pickupList({ pickupDay }),
    apiClient.staff.capacity({ pickupDay }),
  ]);
  const day = { bakeCount, pickupList, dayCapacity };

  return day;
};

const isUnauthorized = (error: unknown) =>
  error instanceof ORPCError && error.code === "UNAUTHORIZED";

function DaySwitch({ current }: { current: DayChoice }) {
  return (
    <nav aria-label="Day" className="flex gap-2">
      {DAY_CHOICES.map(({ choice, label }) => (
        <Button
          key={choice}
          variant={choice === current ? "default" : "outline"}
          nativeButton={false}
          render={
            <Link
              href={`/staff?day=${choice}`}
              aria-current={choice === current ? "page" : undefined}
            />
          }
        >
          {label}
        </Button>
      ))}
    </nav>
  );
}

function BakeCountCard({ products }: { products: BakeCount["products"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bake count</CardTitle>
        <CardDescription>Reserved for pickup this day.</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-muted-foreground">Nothing reserved.</p>
        ) : (
          <ul className="divide-y divide-border">
            {products.map(({ productId, name, quantity }) => (
              <li key={productId} className="flex justify-between gap-4 py-2">
                <span>{name}</span>
                <span className="font-medium tabular-nums">{quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CapacityCard({ pickupDay, products }: DayCapacity) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Capacity</CardTitle>
        <CardDescription>
          How many customers can reserve: the weekday default until you change it, – when not
          offered.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {products.map((product) => (
            <CapacityRow key={product.productId} pickupDay={pickupDay} product={product} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PickupListCard({ reservations }: { reservations: PickupList["reservations"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pickup list</CardTitle>
        <CardDescription>By name, with the code to check at the counter.</CardDescription>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <p className="text-muted-foreground">No reservations.</p>
        ) : (
          <ul className="divide-y divide-border">
            {reservations.map(({ code, name, phone, items }) => (
              <li key={code} className="space-y-1 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="font-medium">{name}</span>
                  <span className="font-mono text-primary tracking-[0.2em]">{code}</span>
                </div>
                <a href={`tel:${phone}`} className="text-muted-foreground text-sm">
                  {phone}
                </a>
                <p className="text-sm">
                  {items
                    .map(({ name: product, quantity }) => `${quantity} × ${product}`)
                    .join(", ")}
                </p>
                <CancelReservationButton code={code} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function StaffDaySkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="h-64 animate-pulse rounded-4xl bg-card" />
      <div className="h-64 animate-pulse rounded-4xl bg-card" />
    </div>
  );
}

export async function StaffDay({ searchParams }: { searchParams: StaffDaySearchParams }) {
  const { day } = await searchParams;
  const choice = dayChoiceOf(day);
  const pickupDay = await pickupDayOf(choice);
  const loaded = await loadDay(pickupDay).catch((error: unknown) => {
    if (isUnauthorized(error)) return null;
    throw error;
  });
  if (!loaded) return <SessionExpired />;
  const { bakeCount, pickupList, dayCapacity } = loaded;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading font-semibold text-2xl">{formatDay(pickupDay)}</h2>
        <DaySwitch current={choice} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <BakeCountCard products={bakeCount.products} />
          <CapacityCard {...dayCapacity} />
        </div>
        <PickupListCard reservations={pickupList.reservations} />
      </div>
    </div>
  );
}
