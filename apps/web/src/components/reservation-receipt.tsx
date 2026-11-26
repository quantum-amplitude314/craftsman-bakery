import type { ReservationReceipt as Receipt } from "@craftsman-bakery/contracts";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDay, formatWallClock } from "@/lib/bakery-day";

export function ReservationReceipt({
  receipt: { code, pickupDay },
  closesAt,
}: {
  receipt: Receipt;
  closesAt: string;
}) {
  return (
    <Card aria-live="polite">
      <CardHeader>
        <CardTitle className="text-xl">Reserved</CardTitle>
        <CardDescription>Pick up on {formatDay(pickupDay)}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground text-sm">Your code, to tell us at the counter</p>
          <p className="font-mono text-5xl text-primary tracking-[0.2em]">{code}</p>
        </div>
        <p className="text-muted-foreground">
          Plans changed?{" "}
          <Link href={`/cancel?code=${code}`} className="text-primary underline underline-offset-4">
            Cancel with the code
          </Link>{" "}
          until {formatWallClock(closesAt)}.
        </p>
        <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/" />}>
          Make another reservation
        </Button>
      </CardContent>
    </Card>
  );
}
