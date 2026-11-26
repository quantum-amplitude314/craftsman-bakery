"use client";

import { useState, useTransition } from "react";
import { cancelReservation } from "@/app/staff/day-actions";
import { SessionExpired } from "@/components/session-expired";
import { Button } from "@/components/ui/button";
import type { StaffCancelOutcome } from "@/lib/staff-cancel";

const FAILURE_MESSAGES: Partial<Record<StaffCancelOutcome["status"], string>> = {
  "not-found": "Already cancelled.",
  "picked-up": "Picked up already.",
  failed: "Could not cancel. Try again.",
};

export function CancelReservationButton({ code }: { code: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [outcome, setOutcome] = useState<StaffCancelOutcome | null>(null);
  const [pending, startTransition] = useTransition();

  if (outcome?.status === "signed-out") return <SessionExpired />;

  const confirm = () =>
    startTransition(async () => {
      const result = await cancelReservation(code);
      setOutcome(result);
      setIsConfirming(false);
    });
  const failureMessage = outcome ? FAILURE_MESSAGES[outcome.status] : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isConfirming ? (
        <>
          <span className="text-sm">Cancel {code}?</span>
          <Button variant="destructive" size="sm" disabled={pending} onClick={confirm}>
            {pending ? "Cancelling…" : "Yes, cancel"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setIsConfirming(false)}
          >
            Keep
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setIsConfirming(true)}>
          Cancel
        </Button>
      )}
      {failureMessage ? (
        <span role="alert" className="text-destructive text-sm">
          {failureMessage}
        </span>
      ) : null}
    </div>
  );
}
