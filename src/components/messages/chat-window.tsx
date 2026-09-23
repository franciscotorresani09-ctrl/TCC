"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSyncedState } from "@/hooks/use-synced-state";
import { ArrowLeft, Car, Check, CheckCheck, CircleDollarSign, Clock, SendHorizontal, TriangleAlert } from "lucide-react";
import type { ChatMessage, ConversationDetail } from "@/server/services/messages";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { SafeImage } from "@/components/ui/safe-image";
import { useToast } from "@/components/ui/toast";
import { useViewer } from "@/components/providers/viewer-provider";
import { useRealtimeEvent } from "@/components/providers/realtime-provider";
import { markConversationReadAction, sendMessageAction, shareListingAction } from "@/server/actions/messages";
import { MakeOfferDialog } from "@/components/offers/make-offer-dialog";
import { ListingPreview, OfferCard, TradeCard } from "./message-cards";
import { cn, formatPrice, formatTime, timeAgo, vehicleTitle } from "@/lib/utils";

type Msg = ChatMessage & { pending?: boolean; failed?: boolean };
type Shareable = { id: string; title: string; price: number; image?: string };

function dayLabel(d: Date) {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export function ChatWindow({ conversation, myListings }: { conversation: ConversationDetail; myListings: Shareable[] }) {
  const viewer = useViewer()!;
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = useSyncedState<Msg[]>(conversation.messages);
  const [online, setOnline] = useSyncedState(conversation.other?.online ?? false);
  const [text, setText] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const other = conversation.other;
  const vehicle = conversation.vehicle;
  const iAmSeller = messages.some((m) => m.offer?.sellerId === viewer.id) || (vehicle && myListings.some((l) => l.id === vehicle.id));


  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: messages.length > conversation.messages.length ? "smooth" : "auto" });
  }, [messages, conversation.messages.length]);

  useEffect(() => {
    markConversationReadAction(conversation.id);
  }, [conversation.id]);

  useRealtimeEvent((e) => {
    if (e.type === "message" && e.conversationId === conversation.id) {
      const m = e.message as unknown as Msg;
      setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev.filter((p) => !(p.pending && p.content === m.content && m.senderId === viewer.id)), m]));
      if (m.senderId !== viewer.id) markConversationReadAction(conversation.id);
    } else if (e.type === "read" && e.conversationId === conversation.id) {
      setMessages((prev) => prev.map((m) => (m.senderId === viewer.id && !m.readAt ? { ...m, readAt: new Date(e.readAt) } : m)));
    } else if (e.type === "presence" && e.userId === other?.id) {
      setOnline(e.online);
    } else if (e.type === "offer" || e.type === "trade") {
      router.refresh();
    }
  });

  const send = async (content = text.trim()) => {
    if (!content) return;
    setText("");
    const tempId = `temp-${Date.now()}`;
    const optimistic: Msg = {
      id: tempId,
      conversationId: conversation.id,
      senderId: viewer.id,
      receiverId: other?.id ?? "",
      type: "TEXT",
      content,
      createdAt: new Date(),
      readAt: null,
      vehicle: null,
      offer: null,
      tradeProposal: null,
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    const res = await sendMessageAction({ conversationId: conversation.id, content });
    if (res.ok) {
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        return withoutTemp.some((m) => m.id === res.data.id) ? withoutTemp : [...withoutTemp, res.data];
      });
    } else {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      toast({ title: "Your message could not be sent.", description: res.error, tone: "error" });
    }
  };

  const share = async (vehicleId: string) => {
    setShareOpen(false);
    const res = await shareListingAction(conversation.id, vehicleId);
    if (!res.ok) toast({ title: res.error, tone: "error" });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-3 py-3 sm:px-5">
        <Link href="/messages" className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg md:hidden" aria-label="Back to conversations">
          <ArrowLeft className="size-5" />
        </Link>
        <Link href={other?.username ? `/u/${other.username}` : "#"} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar src={other?.image} name={other?.name} online={online} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{other?.name ?? "Street-Car member"}</p>
            <p className={cn("text-xs", online ? "text-success" : "text-subtle")}>
              {online ? "Online" : other?.lastSeenAt ? `Last seen ${timeAgo(other.lastSeenAt)}` : "Offline"}
            </p>
          </div>
        </Link>
      </div>

      {vehicle && (
        <div className="border-b border-border px-3 py-2 sm:px-5">
          <ListingPreview vehicle={vehicle} compact />
        </div>
      )}

      {/* Messages */}
      <div ref={scroller} className="flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">Say hello 👋</p>}
        {messages.map((m, i) => {
          const mine = m.senderId === viewer.id;
          const date = new Date(m.createdAt);
          const prev = messages[i - 1];
          const newDay = !prev || new Date(prev.createdAt).toDateString() !== date.toDateString();
          const grouped = prev && prev.senderId === m.senderId && !newDay && date.getTime() - new Date(prev.createdAt).getTime() < 5 * 60000;
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className="flex justify-center py-3">
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium text-muted">{dayLabel(date)}</span>
                </div>
              )}
              {m.type === "SYSTEM" ? (
                <p className="py-2 text-center text-xs text-muted">
                  {m.content} · {formatTime(date)}
                </p>
              ) : (
                <div className={cn("flex animate-fade-in", mine ? "justify-end" : "justify-start", !grouped && "pt-2")}>
                  <div className={cn("flex max-w-[85%] flex-col gap-1.5 sm:max-w-[70%]", mine ? "items-end" : "items-start")}>
                    {m.type === "OFFER" && m.offer && <OfferCard offer={m.offer} viewerId={viewer.id} />}
                    {m.type === "TRADE" && m.tradeProposal && <TradeCard trade={m.tradeProposal} viewerId={viewer.id} />}
                    {m.type === "LISTING" && m.vehicle && (
                      <div className="w-72 max-w-full">
                        <ListingPreview vehicle={m.vehicle} />
                      </div>
                    )}
                    {(m.type === "TEXT" || ((m.type === "OFFER" || m.type === "TRADE") && m.content && !m.content.startsWith("Offered") && !m.content.startsWith("Proposed"))) && (
                      <div
                        className={cn(
                          "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-snug",
                          mine ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-surface-2 text-fg",
                          m.failed && "bg-danger/20 text-danger",
                        )}
                      >
                        {m.content}
                      </div>
                    )}
                    <span className="flex items-center gap-1 px-1 text-[10px] text-subtle">
                      {formatTime(date)}
                      {mine &&
                        (m.failed ? (
                          <TriangleAlert className="size-3 text-danger" aria-label="Not sent" />
                        ) : m.pending ? (
                          <Clock className="size-3" aria-label="Sending" />
                        ) : m.readAt ? (
                          <CheckCheck className="size-3.5 text-info" aria-label="Read" />
                        ) : (
                          <Check className="size-3.5" aria-label="Sent" />
                        ))}
                    </span>
                  </div>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 pb-safe sm:p-4">
        <div className="mb-2 flex gap-2">
          {myListings.length > 0 && (
            <button onClick={() => setShareOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-fg">
              <Car className="size-3.5" /> Share a listing
            </button>
          )}
          {vehicle && !iAmSeller && vehicle.status === "ACTIVE" && (
            <button onClick={() => setOfferOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-fg">
              <CircleDollarSign className="size-3.5" /> Make an offer
            </button>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="composer" className="sr-only">
            Message
          </label>
          <textarea
            id="composer"
            ref={input}
            rows={1}
            value={text}
            maxLength={4000}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
                (e.target as HTMLTextAreaElement).style.height = "auto";
              }
            }}
            placeholder="Write a message…"
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-surface-2 px-4 py-2.5 text-[15px] placeholder:text-subtle focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-hover active:scale-90 disabled:opacity-40"
            aria-label="Send message"
          >
            <SendHorizontal className="size-5" />
          </button>
        </form>
      </div>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share a listing" description="Send one of your vehicles into this conversation.">
        <ul className="space-y-2">
          {myListings.map((l) => (
            <li key={l.id}>
              <button onClick={() => share(l.id)} className="flex w-full items-center gap-3 rounded-2xl border border-border p-2 text-left transition hover:border-accent">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  <SafeImage src={l.image ?? ""} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{l.title}</span>
                  <span className="text-xs text-muted">{formatPrice(l.price)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
      {vehicle && <MakeOfferDialog open={offerOpen} onClose={() => setOfferOpen(false)} vehicle={{ id: vehicle.id, title: vehicleTitle(vehicle), price: vehicle.price }} />}
    </div>
  );
}
