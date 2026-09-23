"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { Button, ButtonLink } from "@/components/ui/button";

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Report to your monitoring service here. Never show raw errors to users.
    console.error(error.digest ?? "client-error");
  }, [error]);
  return (
    <main className="container-page flex min-h-[70dvh] items-center justify-center py-16">
      <ErrorState
        className="w-full max-w-lg"
        title="Something went wrong. Please try again."
        description="We couldn't load this page. If the problem continues, try again in a few minutes."
        action={
          <div className="flex gap-2">
            <Button onClick={reset}>
              <RotateCcw className="size-4" /> Try again
            </Button>
            <ButtonLink href="/" variant="outline">
              Go home
            </ButtonLink>
          </div>
        }
      />
    </main>
  );
}
