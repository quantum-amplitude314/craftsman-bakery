import { StaffCard } from "@/components/staff-card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { getEnv } from "@/lib/env";
import { visitorCountsViewOf } from "@/lib/visitor-counts";

/** About the demo, not the bakery's day: small, and nothing before the first count. */
export async function VisitorCountsCard() {
  const counts = await apiClient.staff.visitorCounts().catch(() => null);
  if (!counts) return null;
  const { BAKERY_TIME_ZONE: timeZone } = await getEnv();
  const { kinds, updatedAt } = visitorCountsViewOf({ counts, timeZone });

  return (
    <StaffCard size="sm" className="shrink-0">
      <CardHeader className="flex flex-wrap items-baseline justify-between gap-x-4">
        <CardTitle>Visitors, last 24 h</CardTitle>
        <CardDescription className="text-xs">
          Classified by Clef · updated {updatedAt}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-wrap gap-x-6 gap-y-1">
          {kinds.map(({ count, label }) => (
            <div key={label} className="flex flex-row-reverse items-baseline gap-1.5">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-semibold text-lg tabular-nums">{count}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </StaffCard>
  );
}
