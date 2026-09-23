"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { useViewer } from "./viewer-provider";

export type ClientRealtimeEvent =
  | { type: "ready" }
  | { type: "message"; conversationId: string; message: { id: string; senderId: string; content: string } & Record<string, unknown> }
  | { type: "notification"; notification: { id: string; title: string; body: string; link: string | null }; unreadCount: number }
  | { type: "unread"; messages: number; notifications: number }
  | { type: "presence"; userId: string; online: boolean }
  | { type: "read"; conversationId: string; readerId: string; readAt: string }
  | { type: "offer"; offerId: string }
  | { type: "trade"; tradeId: string };

type Handler = (event: ClientRealtimeEvent) => void;

interface RealtimeState {
  unreadMessages: number;
  unreadNotifications: number;
  connected: boolean;
  subscribe: (handler: Handler) => () => void;
  setUnreadNotifications: (n: number) => void;
}

const RealtimeContext = createContext<RealtimeState>({
  unreadMessages: 0,
  unreadNotifications: 0,
  connected: false,
  subscribe: () => () => {},
  setUnreadNotifications: () => {},
});

export function RealtimeProvider({ children, initialUnread }: { children: ReactNode; initialUnread: { messages: number; notifications: number } }) {
  const viewer = useViewer();
  const toast = useToast();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const [unreadMessages, setUnreadMessages] = useState(initialUnread.messages);
  const [unreadNotifications, setUnreadNotifications] = useState(initialUnread.notifications);
  const [connected, setConnected] = useState(false);
  const handlers = useRef(new Set<Handler>());

  const subscribe = useCallback((handler: Handler) => {
    handlers.current.add(handler);
    return () => void handlers.current.delete(handler);
  }, []);

  useEffect(() => {
    if (!viewer) return;
    let source: EventSource | null = null;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const connect = () => {
      source = new EventSource("/api/realtime");
      source.onopen = () => {
        retry = 0;
        setConnected(true);
      };
      source.onmessage = (e) => {
        let event: ClientRealtimeEvent;
        try {
          event = JSON.parse(e.data);
        } catch {
          return;
        }
        if (event.type === "unread") {
          setUnreadMessages(event.messages);
          setUnreadNotifications(event.notifications);
        } else if (event.type === "notification") {
          setUnreadNotifications(event.unreadCount);
          const link = event.notification.link;
          const onThread = link && pathRef.current === link;
          if (!onThread) toast({ title: event.notification.title, description: event.notification.body, tone: "info", href: link ?? undefined });
        }
        handlers.current.forEach((h) => h(event));
      };
      source.onerror = () => {
        setConnected(false);
        source?.close();
        if (disposed) return;
        retry = Math.min(retry + 1, 6);
        timer = setTimeout(connect, 1000 * 2 ** retry);
      };
    };
    connect();
    return () => {
      disposed = true;
      clearTimeout(timer);
      source?.close();
    };
  }, [viewer, toast]);

  const value = useMemo(
    () => ({ unreadMessages, unreadNotifications, connected, subscribe, setUnreadNotifications }),
    [unreadMessages, unreadNotifications, connected, subscribe],
  );
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

export function useRealtimeEvent(handler: Handler) {
  const { subscribe } = useRealtime();
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => subscribe((e) => ref.current(e)), [subscribe]);
}
