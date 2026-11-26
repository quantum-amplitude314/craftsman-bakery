import { addDays, weekdayOf } from "@craftsman-bakery/contracts";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DAY_CHOICES = ["today", "tomorrow", "day-after"] as const;

export type DayChoice = (typeof DAY_CHOICES)[number];

const DAYS_AHEAD: Record<DayChoice, number> = { today: 0, tomorrow: 1, "day-after": 2 };

export const dayChoiceOf = (day: unknown): DayChoice =>
  DAY_CHOICES.find((choice) => choice === day) ?? "tomorrow";

export const pickupDayOf = ({ today, choice }: { today: string; choice: DayChoice }) =>
  addDays({ day: today, days: DAYS_AHEAD[choice] });

const labelOf = ({ today, choice }: { today: string; choice: DayChoice }) => {
  if (choice === "today") return "Today";
  if (choice === "tomorrow") return "Tomorrow";

  return weekdayOf(pickupDayOf({ today, choice }));
};

export function DaySwitch({ today, current }: { today: string; current: DayChoice }) {
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
