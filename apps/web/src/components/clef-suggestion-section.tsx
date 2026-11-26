import { type DayCapacity, weekdayOf } from "@craftsman-bakery/contracts";
import { ClefSuggestion, ClefSuggestionCard } from "@/components/clef-suggestion";
import { loadClefAdvice } from "@/lib/load-clef-advice";

export function ClefSuggestionSkeleton() {
  return (
    <ClefSuggestionCard title="Clef suggestion" description="Clef is thinking…">
      <div aria-hidden="true" className="h-40 animate-pulse rounded-xl bg-muted" />
    </ClefSuggestionCard>
  );
}

export async function ClefSuggestionSection({ pickupDay, products }: DayCapacity) {
  const initial = await loadClefAdvice(pickupDay);

  return (
    <ClefSuggestion
      key={pickupDay}
      pickupDay={pickupDay}
      weekday={weekdayOf(pickupDay)}
      products={products}
      initial={initial}
    />
  );
}
