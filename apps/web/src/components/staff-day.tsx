import { addDays, type DayCapacity, type PickupList } from "@craftsman-bakery/contracts";
import { ORPCError } from "@orpc/client";
import Link from "next/link";
import { connection } from "next/server";
import { BakeCountTable } from "@/components/bake-count-table";
import { CancelReservationButton } from "@/components/cancel-reservation-button";
import { SessionExpired } from "@/components/session-expired";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { formatDay, formatWeekday, todayIn } from "@/lib/bakery-day";
import { getEnv } from "@/lib/env";

const DAY_CHOICES = ["today", "tomorrow", "day-after"] as const;

type DayChoice = (typeof DAY_CHOICES)[number];

const DAYS_AHEAD: Record<DayChoice, number> = { today: 0, tomorrow: 1, "day-after": 2 };

export type StaffDaySearchParams = Promise<{ day?: string | string[] }>;

const dayChoiceOf = (day: unknown): DayChoice =>
  DAY_CHOICES.find((choice) => choice === day) ?? "tomorrow";

/** On the bakery's clock, never the viewer's. */
const bakeryToday = async () => {
  await connection();
  const { BAKERY_TIME_ZONE: timeZone } = await getEnv();
  const today = todayIn({ now: new Date(), timeZone });

  return today;
};

const pickupDayOf = ({ today, choice }: { today: string; choice: DayChoice }) =>
  addDays({ day: today, days: DAYS_AHEAD[choice] });

const labelOf = ({ today, choice }: { today: string; choice: DayChoice }) => {
  if (choice === "today") return "Today";
  if (choice === "tomorrow") return "Tomorrow";

  return formatWeekday(pickupDayOf({ today, choice }));
};

const loadDay = async (pickupDay: string) => {
  const [dayCapacity, pickupList] = await Promise.all([
    apiClient.staff.capacity({ pickupDay }),
    apiClient.staff.pickupList({ pickupDay }),
  ]);
  const day = { dayCapacity, pickupList };

  return day;
};

const isUnauthorized = (error: unknown) =>
  error instanceof ORPCError && error.code === "UNAUTHORIZED";

function DaySwitch({ today, current }: { today: string; current: DayChoice }) {
  return (
    <nav aria-label="Day" className="flex gap-2">
      {DAY_CHOICES.map((choice) => (
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
          {labelOf({ today, choice })}
        </Button>
      ))}
    </nav>
  );
}

function BakeCountCard(dayCapacity: DayCapacity) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bake count</CardTitle>
        <CardDescription>
          Reserved is what to bake for pickup this day. Capacity is how many customers can reserve:
          the weekday default until you change it, – when not offered.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BakeCountTable key={dayCapacity.pickupDay} {...dayCapacity} />
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
  const today = await bakeryToday();
  const pickupDay = pickupDayOf({ today, choice });
  const loaded = await loadDay(pickupDay).catch((error: unknown) => {
    if (isUnauthorized(error)) return null;
    throw error;
  });
  if (!loaded) return <SessionExpired />;
  const { dayCapacity, pickupList } = loaded;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading font-semibold text-2xl">{formatDay(pickupDay)}</h2>
        <DaySwitch today={today} current={choice} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <BakeCountCard {...dayCapacity} />
        <PickupListCard reservations={pickupList.reservations} />
      </div>
    </div>
  );
}
