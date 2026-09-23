"use client";

import { useCallback, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/server/errors";

/**
 * Run a server action inside a transition and surface its outcome as a toast.
 * Returns the result so callers can react to field errors or data.
 */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const execute = useCallback(
    <T,>(
      action: () => Promise<ActionResult<T>>,
      opts: { onSuccess?: (data: T) => void; onError?: (r: Extract<ActionResult<T>, { ok: false }>) => void; successToast?: boolean; errorMessage?: string } = {},
    ) =>
      new Promise<ActionResult<T> | null>((resolve) => {
        startTransition(async () => {
          try {
            const result = await action();
            if (result.ok) {
              if (result.message && opts.successToast !== false) toast({ title: result.message });
              opts.onSuccess?.(result.data);
            } else {
              toast({ title: opts.errorMessage ?? result.error, tone: "error" });
              opts.onError?.(result);
            }
            resolve(result);
          } catch {
            toast({ title: opts.errorMessage ?? "Something went wrong. Please try again.", tone: "error" });
            resolve(null);
          }
        });
      }),
    [toast],
  );

  return { pending, execute };
}
