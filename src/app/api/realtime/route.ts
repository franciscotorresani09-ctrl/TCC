import { getSessionUser } from "@/server/auth-guard";
import { db } from "@/server/db";
import { isOnline, publish, subscribe, type RealtimeEvent } from "@/server/realtime/bus";
import { getUnreadCounts } from "@/server/services/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function partnersOf(userId: string) {
  const rows = await db.conversationParticipant.findMany({
    where: { conversation: { participants: { some: { userId } } }, userId: { not: userId } },
    select: { userId: true },
    distinct: ["userId"],
    take: 500,
  });
  return rows.map((r) => r.userId);
}

/** Server-Sent Events stream: messages, notifications, unread counts and presence. */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: RealtimeEvent | { type: "ready" }) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          cleanup();
        }
      };

      const wasOnline = isOnline(user.id);
      const unsubscribe = subscribe(user.id, send);
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          cleanup();
        }
      }, 25_000);

      const partners = await partnersOf(user.id);
      if (!wasOnline) for (const p of partners) publish(p, { type: "presence", userId: user.id, online: true });
      await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);

      send({ type: "ready" });
      send({ type: "unread", ...(await getUnreadCounts(user.id)) });

      let closed = false;
      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        if (!isOnline(user.id)) {
          for (const p of partners) publish(p, { type: "presence", userId: user.id, online: false });
          db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
        }
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
