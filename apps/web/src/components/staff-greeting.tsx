import { SessionExpired } from "@/components/session-expired";
import { getStaffSession } from "@/lib/auth";

function StaffHeading({ subtitle }: { subtitle: string }) {
  return (
    <div className="space-y-1">
      <h1 className="font-heading font-semibold text-3xl">Staff</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function StaffGreetingSkeleton() {
  return <StaffHeading subtitle="Loading…" />;
}

export async function StaffGreeting() {
  const session = await getStaffSession();
  if (!session) return <SessionExpired />;
  const { user } = session;

  return <StaffHeading subtitle={`Signed in as ${user.name}.`} />;
}
