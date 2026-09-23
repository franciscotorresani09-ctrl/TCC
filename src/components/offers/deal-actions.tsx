"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { respondToOfferAction, respondToTradeAction } from "@/server/actions/deals";

type OfferRole = "buyer" | "seller";

/** Buttons for the next valid offer transitions from the viewer's side. */
export function OfferActions({ offerId, status, role, size = "sm" }: { offerId: string; status: string; role: OfferRole; size?: "sm" | "md" }) {
  const router = useRouter();
  const { pending, execute } = useAction();
  const [counterOpen, setCounterOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const act = (action: "accept" | "decline" | "counter" | "withdraw", value?: number) =>
    execute(() => respondToOfferAction(offerId, action, value), {
      onSuccess: () => {
        setCounterOpen(false);
        router.refresh();
      },
    });

  const buttons: React.ReactNode[] = [];
  if (role === "seller" && status === "PENDING") {
    buttons.push(
      <Button key="a" size={size} onClick={() => act("accept")} disabled={pending}>Accept</Button>,
      <Button key="c" size={size} variant="secondary" onClick={() => setCounterOpen(true)} disabled={pending}>Counter</Button>,
      <Button key="d" size={size} variant="ghost" onClick={() => act("decline")} disabled={pending}>Decline</Button>,
    );
  }
  if (role === "buyer" && status === "COUNTERED") {
    buttons.push(
      <Button key="a" size={size} onClick={() => act("accept")} disabled={pending}>Accept counter</Button>,
      <Button key="d" size={size} variant="ghost" onClick={() => act("decline")} disabled={pending}>Decline</Button>,
    );
  }
  if (role === "buyer" && (status === "PENDING" || status === "COUNTERED")) {
    buttons.push(<Button key="w" size={size} variant="ghost" onClick={() => act("withdraw")} disabled={pending}>Withdraw</Button>);
  }
  if (!buttons.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">{buttons}</div>
      <Modal
        open={counterOpen}
        onClose={() => setCounterOpen(false)}
        title="Counter offer"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCounterOpen(false)}>Cancel</Button>
            <Button onClick={() => act("counter", Number(amount))} loading={pending} disabled={!Number(amount)}>Send counter</Button>
          </>
        }
      >
        <Input
          aria-label="Counter amount"
          inputMode="numeric"
          icon={<span className="text-sm">$</span>}
          value={amount ? Number(amount).toLocaleString("en-US") : ""}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
          placeholder="Your price"
          data-autofocus
        />
      </Modal>
    </>
  );
}

export function TradeActions({ tradeId, status, role, size = "sm" }: { tradeId: string; status: string; role: "sender" | "receiver"; size?: "sm" | "md" }) {
  const router = useRouter();
  const { pending, execute } = useAction();
  const [counterOpen, setCounterOpen] = useState(false);
  const [direction, setDirection] = useState<"more" | "less">("more");
  const [cash, setCash] = useState("");

  const act = (action: "accept" | "decline" | "counter" | "cancel" | "complete", value?: number) =>
    execute(() => respondToTradeAction(tradeId, action, value), {
      onSuccess: () => {
        setCounterOpen(false);
        router.refresh();
      },
    });

  const buttons: React.ReactNode[] = [];
  if (role === "receiver" && status === "PENDING") {
    buttons.push(
      <Button key="a" size={size} onClick={() => act("accept")} disabled={pending}>Accept</Button>,
      <Button key="c" size={size} variant="secondary" onClick={() => setCounterOpen(true)} disabled={pending}>Counter</Button>,
      <Button key="d" size={size} variant="ghost" onClick={() => act("decline")} disabled={pending}>Decline</Button>,
    );
  }
  if (role === "sender" && status === "COUNTER_OFFER") {
    buttons.push(
      <Button key="a" size={size} onClick={() => act("accept")} disabled={pending}>Accept counter</Button>,
      <Button key="d" size={size} variant="ghost" onClick={() => act("decline")} disabled={pending}>Decline</Button>,
    );
  }
  if (role === "sender" && (status === "PENDING" || status === "COUNTER_OFFER")) {
    buttons.push(<Button key="x" size={size} variant="ghost" onClick={() => act("cancel")} disabled={pending}>Cancel proposal</Button>);
  }
  if (status === "ACCEPTED") {
    buttons.push(<Button key="done" size={size} onClick={() => act("complete")} disabled={pending}>Mark as completed</Button>);
  }
  if (!buttons.length) return null;

  // Counter cash is expressed from the original sender's perspective (positive = sender adds cash).
  const counterValue = (Number(cash) || 0) * (direction === "more" ? 1 : -1);

  return (
    <>
      <div className="flex flex-wrap gap-2">{buttons}</div>
      <Modal
        open={counterOpen}
        onClose={() => setCounterOpen(false)}
        title="Counter the trade"
        description="Propose a different cash difference."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCounterOpen(false)}>Cancel</Button>
            <Button onClick={() => act("counter", counterValue)} loading={pending}>Send counter</Button>
          </>
        }
      >
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-border p-1">
          {(["more", "less"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={`rounded-lg py-2 text-sm font-medium ${direction === d ? "bg-elevated text-fg" : "text-muted"}`}
            >
              {d === "more" ? "They add cash" : "I add cash"}
            </button>
          ))}
        </div>
        <Input
          aria-label="Cash amount"
          inputMode="numeric"
          icon={<span className="text-sm">$</span>}
          value={cash ? Number(cash).toLocaleString("en-US") : ""}
          onChange={(e) => setCash(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
          placeholder="0 for a straight trade"
        />
      </Modal>
    </>
  );
}
