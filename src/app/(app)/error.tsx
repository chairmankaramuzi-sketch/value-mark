"use client";

import { ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";

/** Route-level error boundary. Never exposes stack traces to users. */
export default function ProtectedError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="Something went wrong"
      description={
        <>
          This page could not be loaded. Please try again.
          {error.digest && <span className="mt-1 block text-xs">Reference: {error.digest}</span>}
        </>
      }
      action={
        <Button variant="secondary" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
