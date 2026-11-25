"use client";

import { catchError, type ErrorInfo } from "next/error";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";

function SectionErrorMessage({
  digest,
  onRetry,
}: {
  digest: string | undefined;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="space-y-3">
      <FormMessage>We could not load this part of the page.</FormMessage>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
      {digest ? <p className="text-muted-foreground text-xs">Error code {digest}</p> : null}
    </div>
  );
}

const renderSectionError = (_props: Record<string, unknown>, { error, retry }: ErrorInfo) => {
  const { digest } = error as Error & { digest?: string };

  return <SectionErrorMessage digest={digest} onRetry={retry} />;
};

export const SectionError = catchError(renderSectionError);
