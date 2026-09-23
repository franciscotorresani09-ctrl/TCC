"use client";

import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useMemo, useState } from "react";
import { useSyncedState } from "@/hooks/use-synced-state";
import { MessageCircle, Search } from "lucide-react";
import type { ConversationSummary } from "@/server/services/messages";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { useRealtimeEvent } from "@/components/providers/realtime-provider";
import { useViewer } from "@/components/providers/viewer-provider";
import { cn, timeAgo, vehicleTitle } from "@/lib/utils";

type Item = ConversationSummary;

function preview(m: Item["lastMessage"], viewerId?: string) {
  if (!m) return "No messages yet";
  const mine = m.senderId === viewerId ? "You: " : "";
  if (m.type === "OFFER") return `${mine}💰 Sent an offer`;
  if (m.type === "TRADE") return `${mine}🔁 Sent a trade proposal`;
  if (m.type === "LISTING") return `${mine}🚗 Shared a listing`;
  return mine + m.content;
}

export function ConversationList({ initial }: { initial: Item[] }) {
  const viewer = useViewer();
  const router = useRouter();
  const activeId = useSelectedLayoutSegment();
  const [items, setItems] = useSyncedState(initial);
  const [q, setQ] = useState("");

  useRealtimeEvent((e) => {
    if (e.type === "message") {
      const m = e.message as unknown as NonNullable<Item["lastMessage"]> & { senderId: string };
      setItems((prev) => {
        const found = prev.find((c) => c.id === e.conversationId);
        if (!found) {
          router.refresh();
          return prev;
        }
        const updated: Item = {
          ...found,
          lastMessage: { content: m.content, type: m.type, senderId: m.senderId, createdAt: m.createdAt },
          lastMessageAt: m.createdAt,
          unread: m.senderId !== viewer?.id && activeId !== found.id ? found.unread + 1 : found.unread,
        };
        return [updated, ...prev.filter((c) => c.id !== found.id)];
      });
    } else if (e.type === "presence") {
      setItems((prev) => prev.map((c) => (c.other?.id === e.userId ? { ...c, other: { ...c.other, online: e.online } } : c)));
    }
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) => [c.other?.name, c.other?.username, c.vehicle && vehicleTitle(c.vehicle)].some((v) => v?.toLowerCase().includes(s)));
  }, [items, q]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h1 className="text-xl font-bold tracking-tight">Messages</h1>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            aria-label="Search conversations"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations"
            className="h-10 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 text-sm placeholder:text-subtle focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            description="Start a conversation with a seller to get things moving."
            action={<ButtonLink href="/marketplace" size="sm">Browse vehicles</ButtonLink>}
            className="border-none bg-transparent"
          />
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">No conversations match “{q}”.</p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((raw) => ({ ...raw, unread: raw.id === activeId ? 0 : raw.unread })).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className={cn("flex items-center gap-3 rounded-2xl p-3 transition", activeId === c.id ? "bg-surface-2" : "hover:bg-surface-2/60")}
                >
                  <Avatar src={c.other?.image} name={c.other?.name} online={c.other?.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{c.other?.name ?? "Street-Car member"}</p>
                      <span className="shrink-0 text-[11px] text-subtle">{timeAgo(c.lastMessageAt).replace(" ago", "")}</span>
                    </div>
                    {c.vehicle && <p className="truncate text-xs text-accent">{vehicleTitle(c.vehicle)}</p>}
                    <div className="flex items-center gap-2">
                      <p className={cn("flex-1 truncate text-xs", c.unread ? "text-fg" : "text-muted")}>{preview(c.lastMessage, viewer?.id)}</p>
                      {c.unread > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold leading-4.5 text-white">{c.unread}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
