import { notFound } from "next/navigation";
import { requireUserPage } from "@/server/auth-guard";
import { getConversation } from "@/server/services/messages";
import { getTradeableVehicles } from "@/server/services/vehicles";
import { ChatWindow } from "@/components/messages/chat-window";
import { vehicleTitle } from "@/lib/utils";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/messages/${id}`);
  const [conversation, listings] = await Promise.all([getConversation(user.id, id), getTradeableVehicles(user.id)]);
  if (!conversation) notFound();
  const mine = listings.filter((l) => l.status === "ACTIVE").map((l) => ({ id: l.id, title: vehicleTitle(l), price: l.price, image: l.images[0]?.url }));
  return <ChatWindow conversation={conversation} myListings={mine} />;
}
