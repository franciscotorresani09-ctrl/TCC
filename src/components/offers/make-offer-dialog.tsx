"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { makeOfferAction } from "@/server/actions/deals";
import { formatPrice } from "@/lib/utils";

export function MakeOfferDialog({ open, onClose, vehicle }: { open: boolean; onClose: () => void; vehicle: { id: string; title: string; price: number } }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(Math.round(vehicle.price * 0.95)));
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();
  const { pending, execute } = useAction();
  const value = Number(amount) || 0;
  const diff = value ? ((value - vehicle.price) / vehicle.price) * 100 : 0;

  const submit = () => {
    if (!value) return setError("Enter an offer amount.");
    setError(undefined);
    execute(() => makeOfferAction({ vehicleId: vehicle.id, amount: value, message: message || undefined }), {
      onSuccess: (d) => {
        onClose();
        router.push(`/messages/${d.conversationId}`);
      },
      onError: (r) => setError(r.fieldErrors?.amount ?? r.error),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Make an Offer"
      description={`${vehicle.title} · Asking ${formatPrice(vehicle.price)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={pending}>
            Send offer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Your offer" error={error}>
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              icon={<span className="text-sm">$</span>}
              value={amount ? Number(amount).toLocaleString("en-US") : ""}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
              className="h-14 text-xl font-semibold"
              data-autofocus
            />
          )}
        </Field>
        <div className="flex flex-wrap gap-2">
          {[0.9, 0.95, 0.97, 1].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setAmount(String(Math.round(vehicle.price * f)))}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-fg"
            >
              {f === 1 ? "Asking price" : `${Math.round((1 - f) * 100)}% below`} · {formatPrice(Math.round(vehicle.price * f))}
            </button>
          ))}
        </div>
        {value > 0 && (
          <p className="text-xs text-muted">
            Your offer is <span className={diff < -15 ? "text-warning" : "text-fg"}>{Math.abs(diff).toFixed(1)}% {diff <= 0 ? "below" : "above"}</span> the asking price.
            {diff < -15 && " Offers far below asking are often declined."}
          </p>
        )}
        <Field label="Message to the seller" optional>
          {(p) => <Textarea {...p} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="Introduce yourself and mention your timeline or financing." />}
        </Field>
      </div>
    </Modal>
  );
}
