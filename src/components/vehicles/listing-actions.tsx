"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, CircleDollarSign, MessageCircle, Pencil } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/input";
import { useViewer } from "@/components/providers/viewer-provider";
import { useAction } from "@/hooks/use-action";
import { startConversationAction } from "@/server/actions/messages";
import { MakeOfferDialog } from "@/components/offers/make-offer-dialog";
import { ProposeTradeDialog, type TradeableVehicle } from "@/components/trades/propose-trade-dialog";
import { FavoriteButton } from "./favorite-button";
import { ShareButton } from "./share-button";

export function ListingActions({
  vehicle,
  sellerId,
  sellerName,
  favorited,
  myVehicles,
  available,
  openToTrade,
  compact,
}: {
  vehicle: TradeableVehicle;
  sellerId: string;
  sellerName: string;
  favorited: boolean;
  myVehicles: TradeableVehicle[];
  available: boolean;
  openToTrade: boolean;
  compact?: boolean;
}) {
  const viewer = useViewer();
  const router = useRouter();
  const pathname = usePathname();
  const [dialog, setDialog] = useState<"message" | "offer" | "trade" | null>(null);
  const [message, setMessage] = useState(`Hi ${sellerName.split(" ")[0]}, is the ${vehicle.title} still available?`);
  const { pending, execute } = useAction();
  const isOwner = viewer?.id === sellerId;

  const requireAuth = (d: typeof dialog) => {
    if (!viewer) return router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
    setDialog(d);
  };

  const send = () =>
    execute(() => startConversationAction({ recipientId: sellerId, vehicleId: vehicle.id, content: message }), {
      onSuccess: (d) => router.push(`/messages/${d.conversationId}`),
    });

  if (isOwner) {
    return (
      <div className="space-y-2">
        <ButtonLink href={`/sell?edit=${vehicle.id}`} size="lg" className="w-full">
          <Pencil className="size-4" /> Edit listing
        </ButtonLink>
        <ButtonLink href="/dashboard/listings" variant="outline" size="lg" className="w-full">
          Manage in dashboard
        </ButtonLink>
      </div>
    );
  }

  const buttons = compact ? (
    <div className="flex shrink-0 gap-2">
      <Button variant="secondary" onClick={() => requireAuth("offer")} aria-label="Make an Offer">
        <CircleDollarSign className="size-4.5" /> Offer
      </Button>
      <Button onClick={() => requireAuth("message")}>
        <MessageCircle className="size-4.5" /> Message
      </Button>
    </div>
  ) : null;

  return (
    <>
      {buttons}
      <div className={compact ? "hidden" : "space-y-2"}>
        <Button size="lg" className="w-full" onClick={() => requireAuth("message")} disabled={!available}>
          <MessageCircle className="size-4.5" /> Message Seller
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="lg" onClick={() => requireAuth("offer")} disabled={!available}>
            <CircleDollarSign className="size-4.5" /> Make an Offer
          </Button>
          <Button variant="secondary" size="lg" onClick={() => requireAuth("trade")} disabled={!available || !openToTrade} title={openToTrade ? undefined : "This seller isn't accepting trades"}>
            <ArrowLeftRight className="size-4.5" /> Propose a Trade
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FavoriteButton targetId={vehicle.id} initial={favorited} variant="outline" label />
          <ShareButton title={vehicle.title} />
        </div>
      </div>

      <Modal
        open={dialog === "message"}
        onClose={() => setDialog(null)}
        title={`Message ${sellerName}`}
        description={vehicle.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={send} loading={pending} disabled={!message.trim()}>
              Send message
            </Button>
          </>
        }
      >
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} aria-label="Message" data-autofocus />
        <div className="mt-3 flex flex-wrap gap-2">
          {["Is the price negotiable?", "Can I schedule a test drive?", "Do you have service records?"].map((q) => (
            <button key={q} type="button" onClick={() => setMessage(q)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:border-border-strong hover:text-fg">
              {q}
            </button>
          ))}
        </div>
      </Modal>
      <MakeOfferDialog open={dialog === "offer"} onClose={() => setDialog(null)} vehicle={vehicle} />
      <ProposeTradeDialog open={dialog === "trade"} onClose={() => setDialog(null)} target={vehicle} myVehicles={myVehicles} />
    </>
  );
}
