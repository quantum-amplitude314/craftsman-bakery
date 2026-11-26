"use client";

import { useState, useTransition } from "react";
import { markPickedUp } from "@/app/staff/day-actions";
import { SessionExpired } from "@/components/session-expired";
import { Button } from "@/components/ui/button";
import type { StaffPickupOutcome } from "@/lib/staff-pickup";

const FAILURE_MESSAGES: Partial<Record<StaffPickupOutcome["status"], string>> = {
  "not-found": "Cancelled meanwhile.",
  "not-pickup-day": "Only on the pickup day.",
  failed: "Could not save. Try again.",
};

export function PickupButton({ code, pickedUp }: { code: string; pickedUp: boolean }) {
  const [outcome, setOutcome] = useState<StaffPickupOutcome | null>(null);
  const [pending, startTransition] = useTransition();

  if (outcome?.status === "signed-out") return <SessionExpired />;

  const toggle = () =>
    startTransition(async () => {
      setOutcome(await markPickedUp({ code, pickedUp: !pickedUp }));
    });
  const failureMessage = outcome ? FAILURE_MESSAGES[outcome.status] : undefined;
  const label = pickedUp ? "Undo pickup" : "Picked up";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {failureMessage ? (
        <span role="alert" className="text-destructive text-sm">
          {failureMessage}
        </span>
      ) : null}
      <Button
        variant={pickedUp ? "ghost" : "default"}
        size="sm"
        disabled={pending}
        onClick={toggle}
      >
        {pending ? "Saving…" : label}
      </Button>
    </div>
  );
}
