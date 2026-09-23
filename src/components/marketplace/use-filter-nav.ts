"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/** Update marketplace query params (resetting pagination) without a full reload. */
export function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (changes: Record<string, string | string[] | number | undefined | null>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        const str = Array.isArray(value) ? value.join(",") : value === undefined || value === null ? "" : String(value);
        if (str) sp.set(key, str);
        else sp.delete(key);
      }
      sp.delete("page");
      startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }));
    },
    [params, pathname, router],
  );

  const reset = useCallback(
    (keep: string[] = ["q", "sort", "view"]) => {
      const sp = new URLSearchParams();
      for (const k of keep) {
        const v = params.get(k);
        if (v) sp.set(k, v);
      }
      startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }));
    },
    [params, pathname, router],
  );

  return { params, update, reset, pending };
}
