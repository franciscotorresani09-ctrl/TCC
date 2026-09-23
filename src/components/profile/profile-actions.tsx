"use client";

import { useOptimistic, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Plus, Star, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useViewer } from "@/components/providers/viewer-provider";
import { useToast } from "@/components/ui/toast";
import { useAction } from "@/hooks/use-action";
import { addGarageVehicleAction, createReviewAction, toggleFollowAction } from "@/server/actions/social";
import { startConversationAction } from "@/server/actions/messages";
import { cn } from "@/lib/utils";

function useAuthGate() {
  const viewer = useViewer();
  const router = useRouter();
  const pathname = usePathname();
  return (fn: () => void) => (viewer ? fn() : router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`));
}

export function FollowButton({ userId, initial, followers }: { userId: string; initial: boolean; followers: number }) {
  const gate = useAuthGate();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useOptimistic({ following: initial, followers });
  return (
    <Button
      variant={state.following ? "secondary" : "primary"}
      disabled={pending}
      onClick={() =>
        gate(() =>
          start(async () => {
            setState({ following: !state.following, followers: state.followers + (state.following ? -1 : 1) });
            const res = await toggleFollowAction(userId);
            if (!res.ok) toast({ title: res.error, tone: "error" });
            router.refresh();
          }),
        )
      }
    >
      {state.following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
      {state.following ? "Following" : "Follow"}
    </Button>
  );
}

export function MessageUserButton({ userId, name }: { userId: string; name: string }) {
  const gate = useAuthGate();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(`Hi ${name.split(" ")[0]}! `);
  const { pending, execute } = useAction();
  return (
    <>
      <Button variant="outline" onClick={() => gate(() => setOpen(true))}>
        <MessageCircle className="size-4" /> Message
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Message ${name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              loading={pending}
              disabled={!text.trim()}
              onClick={() => execute(() => startConversationAction({ recipientId: userId, content: text }), { onSuccess: (d) => router.push(`/messages/${d.conversationId}`) })}
            >
              Send message
            </Button>
          </>
        }
      >
        <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} aria-label="Message" data-autofocus />
      </Modal>
    </>
  );
}

export function WriteReviewButton({ targetUserId, name }: { targetUserId: string; name: string }) {
  const gate = useAuthGate();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const { pending, execute } = useAction();
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => gate(() => setOpen(true))}>
        <Star className="size-4" /> Write a review
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Review ${name}`}
        description="Share your experience buying, selling, or trading with this member."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              loading={pending}
              disabled={!rating || comment.trim().length < 10}
              onClick={() =>
                execute(() => createReviewAction({ targetUserId, rating, comment }), {
                  onSuccess: () => {
                    setOpen(false);
                    router.refresh();
                  },
                })
              }
            >
              Post review
            </Button>
          </>
        }
      >
        <div className="mb-4 flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} className="p-1 transition active:scale-90">
              <Star className={cn("size-8 transition", n <= (hover || rating) ? "fill-warning text-warning" : "text-border-strong")} />
            </button>
          ))}
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="How was the communication? Was the vehicle as described?" aria-label="Review" />
        <p className="mt-1.5 text-xs text-subtle">Minimum 10 characters.</p>
      </Modal>
    </>
  );
}

export function AddGarageVehicleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ make: "", model: "", year: "", notes: "" });
  const { pending, execute } = useAction();
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add vehicle
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add to your garage"
        description="Show off the vehicles you own. Garage vehicles aren't for sale."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              loading={pending}
              onClick={() =>
                execute(() => addGarageVehicleAction({ make: form.make, model: form.model, year: Number(form.year), notes: form.notes || undefined }), {
                  onSuccess: () => {
                    setOpen(false);
                    setForm({ make: "", model: "", year: "", notes: "" });
                    router.refresh();
                  },
                })
              }
            >
              Add vehicle
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Year">{(p) => <Input {...p} inputMode="numeric" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value.replace(/\D/g, "").slice(0, 4) })} />}</Field>
          <Field label="Make">{(p) => <Input {...p} value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} maxLength={40} />}</Field>
          <Field label="Model">{(p) => <Input {...p} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} maxLength={60} />}</Field>
          <Field label="Notes" optional className="sm:col-span-3">
            {(p) => <Input {...p} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={200} />}
          </Field>
        </div>
      </Modal>
    </>
  );
}
