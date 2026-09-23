import type { Metadata } from "next";
import { requireUserPage } from "@/server/auth-guard";
import { listConversations } from "@/server/services/messages";
import { ConversationList } from "@/components/messages/conversation-list";
import { MessagesShell } from "@/components/messages/messages-shell";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/messages");
  const conversations = await listConversations(user.id);
  return <MessagesShell list={<ConversationList initial={conversations} />}>{children}</MessagesShell>;
}
