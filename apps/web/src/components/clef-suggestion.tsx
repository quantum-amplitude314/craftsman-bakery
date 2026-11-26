"use client";

import type { DayCapacity, DemandOutlook } from "@craftsman-bakery/contracts";
import { type ReactNode, useState, useTransition } from "react";
import { askClef } from "@/app/staff/day-actions";
import { AcceptSuggestionButton } from "@/components/accept-suggestion-button";
import { SessionExpired } from "@/components/session-expired";
import { StaffCard } from "@/components/staff-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ClefAdviceState, dayOutlookOf } from "@/lib/clef-advice";

const dayLineOf = ({ outlook, weekday }: { outlook: DemandOutlook; weekday: string }) => {
  const lines: Record<DemandOutlook, string> = {
    much_less: `A much quieter ${weekday} than usual.`,
    less: `A quieter ${weekday} than usual.`,
    usual: `A usual ${weekday}: expect the usual demand.`,
    more: `A busier ${weekday} than usual.`,
    much_more: `A much busier ${weekday} than usual.`,
  };

  return lines[outlook];
};

export function ClefSuggestionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <StaffCard>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </StaffCard>
  );
}

function SuggestionRows({
  pickupDay,
  products,
  advised,
}: {
  pickupDay: string;
  products: DayCapacity["products"];
  advised: Extract<ClefAdviceState, { status: "advised" }>["products"];
}) {
  return (
    <ul className="divide-y divide-border">
      {advised.map(({ productId, suggested }) => {
        const product = products.find((candidate) => candidate.productId === productId);
        if (!product) return null;
        const { name, capacity } = product;

        return (
          <li key={productId} className="flex items-center gap-4 py-2">
            <span className="flex-1">{name}</span>
            <span className="w-10 text-right font-medium text-base tabular-nums">
              {suggested ?? "–"}
            </span>
            <div className="w-16 text-right">
              {suggested === null || suggested === capacity ? (
                <span className="text-muted-foreground text-sm">in use</span>
              ) : (
                <AcceptSuggestionButton
                  pickupDay={pickupDay}
                  productId={productId}
                  suggested={suggested}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ClefSuggestion({
  pickupDay,
  weekday,
  products,
  initial,
}: DayCapacity & { weekday: string; initial: ClefAdviceState }) {
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (state.status === "signed-out") return <SessionExpired />;

  const askAgain = () =>
    startTransition(async () => {
      setState(await askClef(pickupDay));
    });
  const description =
    state.status === "advised"
      ? dayLineOf({ outlook: dayOutlookOf(state.products), weekday })
      : "Clef could not answer just now; the capacities stay as they are.";

  return (
    <ClefSuggestionCard title="Clef suggestion" description={description}>
      {state.status === "advised" ? (
        <SuggestionRows pickupDay={pickupDay} products={products} advised={state.products} />
      ) : null}
      <Button variant="outline" disabled={pending} onClick={askAgain}>
        {pending ? "Clef is thinking…" : "Ask again"}
      </Button>
    </ClefSuggestionCard>
  );
}
