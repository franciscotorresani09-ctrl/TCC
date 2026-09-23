"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useViewer } from "@/components/providers/viewer-provider";
import { useAction } from "@/hooks/use-action";
import { reportAction } from "@/server/actions/vehicles";
import { REPORT_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ReportButton({ target, label = "Report listing", className }: { target: { vehicleId?: string; eventId?: string; targetUserId?: string; reviewId?: string }; label?: string; className?: string }) {
  const viewer = useViewer();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const { pending, execute } = useAction();

  const submit = () =>
    execute(() => reportAction({ ...target, reason, details }), {
      onSuccess: () => {
        setOpen(false);
        setReason("");
        setDetails("");
      },
    });

  return (
    <>
      <button
        type="button"
        onClick={() => (viewer ? setOpen(true) : router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`))}
        className={cn("inline-flex items-center gap-1.5 text-xs text-subtle transition hover:text-danger", className)}
      >
        <Flag className="size-3.5" /> {label}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Report"
        description="Help keep Street-Car safe. Reports are confidential."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submit} loading={pending} disabled={!reason}>
              Submit report
            </Button>
          </>
        }
      >
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">What&apos;s the problem?</legend>
          {REPORT_REASONS.list.map((r) => (
            <label key={r.value} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition", reason === r.value ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong")}>
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-[var(--color-accent)]" />
              {r.label}
            </label>
          ))}
        </fieldset>
        <Textarea className="mt-4" placeholder="Add any details that can help our team (optional)" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} aria-label="Details" />
      </Modal>
    </>
  );
}
