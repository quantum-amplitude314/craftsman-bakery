import { addDays, type DayCapacity, type PickupList, weekdayOf } from "@craftsman-bakery/contracts";
import { ORPCError } from "@orpc/client";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BakeCountTable } from "@/components/bake-count-table";
import { CancelReservationButton } from "@/components/cancel-reservation-button";
import {
  ClefSuggestionSection,
  ClefSuggestionSkeleton,
} from "@/components/clef-suggestion-section";
import { SectionError } from "@/components/section-error";
import { SessionExpired } from "@/components/session-expired";
import { StaffCard } from "@/components/staff-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { formatDay, todayIn } from "@/lib/bakery-day";
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

  return weekdayOf(pickupDayOf({ today, choice }));
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
    <StaffCard>
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
    </StaffCard>
  );
}

function PickupEntry({ code, name, phone, items }: PickupList["reservations"][number]) {
  return (
    <li className="space-y-2 py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="font-mono font-semibold text-2xl text-primary tracking-[0.2em]">{code}</p>
        <CancelReservationButton code={code} />
      </div>
      <dl className="grid grid-cols-[3rem_1fr] gap-x-3 text-muted-foreground text-xs">
        <dt>Name</dt>
        <dd>{name}</dd>
        <dt>Phone</dt>
        <dd>
          <a href={`tel:${phone}`} className="underline-offset-4 hover:underline">
            {phone}
          </a>
        </dd>
      </dl>
      <ul className="space-y-0.5">
        {items.map(({ productId, name: product, quantity }) => (
          <li key={productId}>
            <span className="font-medium tabular-nums">{quantity} ×</span> {product}
          </li>
        ))}
      </ul>
    </li>
  );
}

function PickupListCard({ reservations }: { reservations: PickupList["reservations"] }) {
  return (
    <StaffCard>
      <CardHeader>
        <CardTitle className="text-lg">
          Pickup list
          {reservations.length > 0 ? (
            <span className="ml-2 font-normal text-muted-foreground">{reservations.length}</span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <p className="text-muted-foreground">No reservations.</p>
        ) : (
          // Scrolls inside the card, so a busy day does not stretch the page.
          <ul className="-mr-2 max-h-[36rem] divide-y divide-border overflow-y-auto pr-2">
            {reservations.map((reservation) => (
              <PickupEntry key={reservation.code} {...reservation} />
            ))}
          </ul>
        )}
      </CardContent>
    </StaffCard>
  );
}

export function StaffDaySkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="h-64 animate-pulse rounded-2xl bg-card" />
      <div className="h-64 animate-pulse rounded-2xl bg-card" />
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
        <div className="space-y-6">
          <BakeCountCard {...dayCapacity} />
          <SectionError>
            <Suspense fallback={<ClefSuggestionSkeleton />}>
              <ClefSuggestionSection {...dayCapacity} />
            </Suspense>
          </SectionError>
        </div>
        <PickupListCard reservations={pickupList.reservations} />
      </div>
    </div>
  );
}
