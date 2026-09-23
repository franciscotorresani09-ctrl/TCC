"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, CarFront, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { EmptyState } from "@/components/ui/empty-state";
import { useAction } from "@/hooks/use-action";
import { proposeTradeAction } from "@/server/actions/deals";
import { cn, formatPrice } from "@/lib/utils";

export interface TradeableVehicle {
  id: string;
  title: string;
  price: number;
  image?: string;
}

export function ProposeTradeDialog({
  open,
  onClose,
  target,
  myVehicles,
}: {
  open: boolean;
  onClose: () => void;
  target: TradeableVehicle;
  myVehicles: TradeableVehicle[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(myVehicles[0]?.id ?? "");
  const [direction, setDirection] = useState<"add" | "request">("add");
  const [cash, setCash] = useState("");
  const [message, setMessage] = useState("");
  const { pending, execute } = useAction();
  const mine = myVehicles.find((v) => v.id === selected);
  const cashValue = (Number(cash) || 0) * (direction === "add" ? 1 : -1);
  const gap = mine ? target.price - mine.price : 0;

  const submit = () =>
    execute(
      () => proposeTradeAction({ offeredVehicleId: selected, requestedVehicleId: target.id, cashDifference: cashValue, message: message || undefined }),
      {
        onSuccess: (d) => {
          onClose();
          router.push(`/messages/${d.conversationId}`);
        },
      },
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Propose a Trade"
      description="Offer one of your vehicles, with optional cash on top."
      footer={
        myVehicles.length ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit} loading={pending} disabled={!selected}>
              <ArrowLeftRight className="size-4" /> Send proposal
            </Button>
          </>
        ) : undefined
      }
    >
      {!myVehicles.length ? (
        <EmptyState
          icon={CarFront}
          title="List a vehicle to trade"
          description="Trades are made with vehicles you've listed on Street-Car. Create a listing first, then come back here."
          action={<ButtonLink href="/sell">List your vehicle</ButtonLink>}
          className="border-none py-8"
        />
      ) : (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">Your vehicle</p>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Select your vehicle">
              {myVehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={selected === v.id}
                  onClick={() => setSelected(v.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-2.5 text-left transition",
                    selected === v.id ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong",
                  )}
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    <SafeImage src={v.image ?? ""} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{v.title}</span>
                    <span className="text-xs text-muted">{formatPrice(v.price)}</span>
                  </span>
                  {selected === v.id && <Check className="size-4 text-accent" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Cash difference</p>
            <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl border border-border p-1" role="radiogroup" aria-label="Cash direction">
              {(["add", "request"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={direction === d}
                  onClick={() => setDirection(d)}
                  className={cn("rounded-lg py-2 text-sm font-medium transition", direction === d ? "bg-elevated text-fg" : "text-muted hover:text-fg")}
                >
                  {d === "add" ? "I'll add cash" : "I'm asking for cash"}
                </button>
              ))}
            </div>
            <Input
              aria-label="Cash amount"
              inputMode="numeric"
              icon={<span className="text-sm">$</span>}
              placeholder="0 (straight trade)"
              value={cash ? Number(cash).toLocaleString("en-US") : ""}
              onChange={(e) => setCash(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
            />
            {mine && gap !== 0 && (
              <p className="mt-2 text-xs text-muted">
                Listed prices differ by {formatPrice(Math.abs(gap))} ({gap > 0 ? "their vehicle is priced higher" : "your vehicle is priced higher"}).
              </p>
            )}
          </div>

          <Field label="Message" optional>
            {(p) => <Textarea {...p} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="Tell the seller about your vehicle's condition, history, and why this trade makes sense." />}
          </Field>

          {mine && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 p-4 text-sm">
              <span className="min-w-0 truncate font-medium">{mine.title}</span>
              <span className="flex shrink-0 flex-col items-center text-xs text-accent">
                <ArrowLeftRight className="size-4" />
                {cashValue ? `${cashValue > 0 ? "+" : "−"} ${formatPrice(Math.abs(cashValue))}` : "Even"}
              </span>
              <span className="min-w-0 truncate text-right font-medium">{target.title}</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
