import "server-only";

/**
 * In-process pub/sub used by the Server-Sent Events endpoint to push messages,
 * notifications and presence to connected clients. For multi-instance
 * deployments, back `publish` with Redis pub/sub (the interface stays the same).
 */
export type RealtimeEvent =
  | { type: "message"; conversationId: string; message: unknown }
  | { type: "notification"; notification: unknown; unreadCount: number }
  | { type: "unread"; messages: number; notifications: number }
  | { type: "presence"; userId: string; online: boolean }
  | { type: "read"; conversationId: string; readerId: string; readAt: string }
  | { type: "offer"; offerId: string }
  | { type: "trade"; tradeId: string };

type Listener = (event: RealtimeEvent) => void;

interface Bus {
  listeners: Map<string, Set<Listener>>;
}

const bus: Bus = ((globalThis as { __streetCarBus?: Bus }).__streetCarBus ??= { listeners: new Map() });

export function subscribe(userId: string, listener: Listener) {
  let set = bus.listeners.get(userId);
  if (!set) {
    set = new Set();
    bus.listeners.set(userId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) bus.listeners.delete(userId);
  };
}

export function publish(userId: string, event: RealtimeEvent) {
  const set = bus.listeners.get(userId);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(event);
    } catch {
      // A broken stream must not affect other subscribers.
    }
  }
}

export function isOnline(userId: string) {
  return (bus.listeners.get(userId)?.size ?? 0) > 0;
}

export function onlineUserIds(ids: string[]) {
  return ids.filter(isOnline);
}
