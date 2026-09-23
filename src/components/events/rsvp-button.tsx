"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useViewer } from "@/components/providers/viewer-provider";
import { useToast } from "@/components/ui/toast";
import { rsvpAction } from "@/server/actions/events";

type Status = "GOING" | "INTERESTED" | null;

export function RsvpButtons({ eventId, initial, full, disabled, isOrganizer }: { eventId: string; initial: Status; full: boolean; disabled?: boolean; isOrganizer: boolean }) {
  const viewer = useViewer();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [status, setStatus] = useOptimistic<Status>(initial);

  const choose = (next: Status) => {
    if (!viewer) return router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
    const target = status === next ? null : next;
    start(async () => {
      setStatus(target);
      const res = await rsvpAction(eventId, target);
      if (!res.ok) toast({ title: res.error, tone: "error" });
      else toast({ title: target === "GOING" ? "You're going! We'll remind you before it starts." : target === "INTERESTED" ? "Marked as interested." : "RSVP removed." });
      router.refresh();
    });
  };

  if (isOrganizer) {
    return <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-center text-sm text-success">You&apos;re organizing this event</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button size="lg" variant={status === "GOING" ? "secondary" : "primary"} onClick={() => choose("GOING")} disabled={disabled || pending || (full && status !== "GOING")}>
        <Check className="size-4" /> {status === "GOING" ? "Going" : full ? "Event full" : "RSVP"}
      </Button>
      <Button size="lg" variant="outline" onClick={() => choose("INTERESTED")} disabled={disabled || pending} aria-pressed={status === "INTERESTED"}>
        <Star className={status === "INTERESTED" ? "size-4 fill-warning text-warning" : "size-4"} /> Interested
      </Button>
    </div>
  );
}
