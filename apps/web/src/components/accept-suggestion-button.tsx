"use client";

import { useState, useTransition } from "react";
import { acceptSuggestion } from "@/app/staff/day-actions";
import { SessionExpired } from "@/components/session-expired";
import { Button } from "@/components/ui/button";
import type { CapacityState } from "@/lib/capacity-form";

const FAILURE_MESSAGES: Partial<Record<CapacityState["status"], string>> = {
  "below-reserved": "More are reserved already.",
  failed: "Could not save. Try again.",
};

export function AcceptSuggestionButton({
  pickupDay,
  productId,
  suggested,
}: {
  pickupDay: string;
  productId: string;
  suggested: number;
}) {
  const [outcome, setOutcome] = useState<CapacityState | null>(null);
  const [pending, startTransition] = useTransition();

  if (outcome?.status === "signed-out") return <SessionExpired />;

  const accept = () =>
    startTransition(async () => {
      setOutcome(await acceptSuggestion({ pickupDay, productId, capacity: suggested }));
    });
  const failureMessage = outcome ? FAILURE_MESSAGES[outcome.status] : undefined;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" disabled={pending} onClick={accept}>
        {pending ? "Saving…" : "Use"}
      </Button>
      {failureMessage ? (
        <span role="alert" className="text-destructive text-xs">
          {failureMessage}
        </span>
      ) : null}
    </div>
  );
}
