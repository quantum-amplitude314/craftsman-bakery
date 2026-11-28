import type { PickupList } from "@craftsman-bakery/contracts";
import { CancelReservationButton } from "@/components/cancel-reservation-button";
import { PickupButton } from "@/components/pickup-button";
import { StaffCard } from "@/components/staff-card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Reservation = PickupList["reservations"][number];

function PickupEntry({
  reservation: { code, name, phone, pickedUp, items },
  isToday,
}: {
  reservation: Reservation;
  isToday: boolean;
}) {
  return (
    <li className="space-y-2 py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p
          className={
            pickedUp
              ? "font-mono font-semibold text-2xl text-muted-foreground tracking-[0.2em] line-through"
              : "font-mono font-semibold text-2xl text-primary tracking-[0.2em]"
          }
        >
          {code}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {pickedUp ? null : <CancelReservationButton code={code} />}
          {isToday ? <PickupButton code={code} pickedUp={pickedUp} /> : null}
        </div>
      </div>
      <div className={pickedUp ? "space-y-2 opacity-60" : "space-y-2"}>
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
      </div>
    </li>
  );
}

function PickupCount({ reservations, isToday }: { reservations: Reservation[]; isToday: boolean }) {
  const pickedUpCount = reservations.filter(({ pickedUp }) => pickedUp).length;
  const count = isToday
    ? `${pickedUpCount} of ${reservations.length} picked up`
    : `${reservations.length}`;

  return <span className="ml-2 font-normal text-muted-foreground">{count}</span>;
}

export function PickupListCard({
  reservations,
  isToday,
}: {
  reservations: Reservation[];
  isToday: boolean;
}) {
  return (
    <StaffCard className="min-h-0 lg:flex-1">
      <CardHeader>
        <CardTitle className="text-lg">
          Pickup list
          {reservations.length > 0 ? (
            <PickupCount reservations={reservations} isToday={isToday} />
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {reservations.length === 0 ? (
          <p className="text-muted-foreground">No reservations.</p>
        ) : (
          // Scrolls inside the card, so a busy day does not stretch the page: up to a fixed height
          // in one column, from lg within the height the left column sets.
          <ul className="-mr-4 max-h-[36rem] min-h-0 flex-1 divide-y divide-border overflow-y-auto pr-4 [scrollbar-gutter:stable] [scrollbar-width:thin] lg:max-h-none">
            {reservations.map((reservation) => (
              <PickupEntry key={reservation.code} reservation={reservation} isToday={isToday} />
            ))}
          </ul>
        )}
      </CardContent>
    </StaffCard>
  );
}
