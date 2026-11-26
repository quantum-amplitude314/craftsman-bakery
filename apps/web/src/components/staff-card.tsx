import type { ComponentProps } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A work tool: tighter corners than the customer pages. */
export function StaffCard({ className, ...props }: ComponentProps<typeof Card>) {
  return <Card className={cn("rounded-2xl", className)} {...props} />;
}
