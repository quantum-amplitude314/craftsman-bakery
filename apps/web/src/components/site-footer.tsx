import Link from "next/link";
import { QaCredit } from "@/components/qa-credit";
import packageJson from "../../package.json";

const APP_VERSION = `v${packageJson.version}`;

/** Made up for the demo, as a real bakery's site would show them. */
const BAKERY = { address: "Pekařská 12, Praha 1", hours: "Tue–Sat 7:00–18:00" };

export function SiteFooter() {
  const { address, hours } = BAKERY;

  return (
    <footer className="mt-12 border-t py-6 text-muted-foreground text-xs">
      <div className="mx-auto max-w-2xl space-y-4 px-4 lg:max-w-5xl">
        <div className="flex flex-wrap justify-between gap-2">
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            <span>Craftsman Bakery</span>
            <span>{address}</span>
            <span>{hours}</span>
          </p>
          <p>Baked at dawn, reserved the day before.</p>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2">
          <Link
            href="/staff/sign-in"
            className="justify-self-start transition-colors hover:text-foreground"
          >
            Staff sign-in
          </Link>
          <QaCredit />
          <p className="justify-self-end">{APP_VERSION}</p>
        </div>
      </div>
    </footer>
  );
}
