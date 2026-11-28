import { clockOf, type DayCapacity } from "@craftsman-bakery/contracts";
import { ORPCError } from "@orpc/client";
import { connection } from "next/server";
import { Suspense } from "react";
import { BakeCountTable } from "@/components/bake-count-table";
import {
  ClefSuggestionSection,
  ClefSuggestionSkeleton,
} from "@/components/clef-suggestion-section";
import { DaySwitch, dayChoiceOf, pickupDayOf } from "@/components/day-switch";
import { PickupListCard } from "@/components/pickup-list";
import { SectionError } from "@/components/section-error";
import { SessionExpired } from "@/components/session-expired";
import { StaffCard } from "@/components/staff-card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitorCountsCard } from "@/components/visitor-counts-card";
import { apiClient } from "@/lib/api";
import { formatDay } from "@/lib/bakery-day";
import { getEnv } from "@/lib/env";

type StaffDaySearchParams = Promise<{ day?: string | string[] }>;

/** On the bakery's clock, never the viewer's. */
const bakeryToday = async () => {
  await connection();
  const { BAKERY_TIME_ZONE: timeZone } = await getEnv();
  const { day: today } = clockOf({ instant: new Date(), timeZone });

  return today;
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
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6 lg:self-start">
          <BakeCountCard {...dayCapacity} />
          {choice === "today" ? null : (
            <SectionError>
              <Suspense fallback={<ClefSuggestionSkeleton />}>
                <ClefSuggestionSection {...dayCapacity} />
              </Suspense>
            </SectionError>
          )}
        </div>
        {/* From lg the left column sets the height; the pickup list fills what the visitors leave. */}
        <div className="flex flex-col gap-6 lg:h-0 lg:min-h-full">
          <PickupListCard reservations={pickupList.reservations} isToday={choice === "today"} />
          <Suspense fallback={null}>
            <VisitorCountsCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
