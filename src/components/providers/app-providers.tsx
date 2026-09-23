"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { ViewerProvider, type Viewer } from "./viewer-provider";
import { RealtimeProvider } from "./realtime-provider";

export function AppProviders({
  viewer,
  unread,
  children,
}: {
  viewer: Viewer | null;
  unread: { messages: number; notifications: number };
  children: ReactNode;
}) {
  return (
    <ToastProvider>
      <ViewerProvider viewer={viewer}>
        <RealtimeProvider initialUnread={unread}>{children}</RealtimeProvider>
      </ViewerProvider>
    </ToastProvider>
  );
}
