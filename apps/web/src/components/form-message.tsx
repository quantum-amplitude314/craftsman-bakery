import type { ReactNode } from "react";

/** A problem with the last submission, shown above the submit button. */
export function FormMessage({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
      {children}
    </div>
  );
}
