import type { PickupList } from "@craftsman-bakery/contracts";
import { CancelReservationButton } from "@/components/cancel-reservation-button";
import { StaffCard } from "@/components/staff-card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function PickupEntry({ code, name, phone, items }: PickupList["reservations"][number]) {
  return (
    <li className="space-y-2 py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="font-mono font-semibold text-2xl text-primary tracking-[0.2em]">{code}</p>
        <CancelReservationButton code={code} />
      </div>
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
    </li>
  );
}

export function PickupListCard({ reservations }: { reservations: PickupList["reservations"] }) {
  return (
    <StaffCard>
      <CardHeader>
        <CardTitle className="text-lg">
          Pickup list
          {reservations.length > 0 ? (
            <span className="ml-2 font-normal text-muted-foreground">{reservations.length}</span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <p className="text-muted-foreground">No reservations.</p>
        ) : (
          // Scrolls inside the card, so a busy day does not stretch the page.
          <ul className="-mr-2 max-h-[36rem] divide-y divide-border overflow-y-auto pr-2">
            {reservations.map((reservation) => (
              <PickupEntry key={reservation.code} {...reservation} />
            ))}
          </ul>
        )}
      </CardContent>
    </StaffCard>
  );
}
