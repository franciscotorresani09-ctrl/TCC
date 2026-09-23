"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useAction } from "@/hooks/use-action";
import type { ActionResult } from "@/server/errors";

/** Runs a pre-bound admin server action, optionally behind a confirmation dialog. */
export function AdminButton({
  action,
  children,
  variant = "outline",
  confirm,
}: {
  action: () => Promise<ActionResult<unknown>>;
  children: React.ReactNode;
  variant?: "outline" | "danger" | "primary" | "ghost" | "secondary";
  confirm?: { title: string; description: string };
}) {
  const router = useRouter();
  const { pending, execute } = useAction();
  const [open, setOpen] = useState(false);
  const run = () => execute(action, { onSuccess: () => { setOpen(false); router.refresh(); } });
  return (
    <>
      <Button size="sm" variant={variant} loading={pending} onClick={() => (confirm ? setOpen(true) : run())}>
        {children}
      </Button>
      {confirm && (
        <ConfirmDialog open={open} onClose={() => setOpen(false)} onConfirm={run} loading={pending} title={confirm.title} description={confirm.description} danger={variant === "danger"} confirmLabel="Confirm" />
      )}
    </>
  );
}
