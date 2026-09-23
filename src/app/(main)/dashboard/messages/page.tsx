import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireUserPage } from "@/server/auth-guard";
import { listConversations } from "@/server/services/messages";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { timeAgo, vehicleTitle } from "@/lib/utils";

export default async function DashboardMessages() {
  const user = await requireUserPage("/dashboard/messages");
  const conversations = await listConversations(user.id);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent conversations</h2>
        <ButtonLink href="/messages" size="sm" variant="outline">
          Open inbox
        </ButtonLink>
      </div>
      {conversations.length ? (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className="flex items-center gap-3 p-4 transition hover:bg-surface-2">
                <Avatar src={c.other?.image} name={c.other?.name} online={c.other?.online} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.other?.name}</p>
                  {c.vehicle && <p className="truncate text-xs text-accent">{vehicleTitle(c.vehicle)}</p>}
                  <p className="truncate text-sm text-muted">{c.lastMessage?.content ?? "No messages yet"}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-subtle">{timeAgo(c.lastMessageAt)}</span>
                  {c.unread > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={MessageCircle} title="No messages yet" description="Start a conversation with a seller to get things moving." action={<ButtonLink href="/marketplace">Browse vehicles</ButtonLink>} />
      )}
    </div>
  );
}
