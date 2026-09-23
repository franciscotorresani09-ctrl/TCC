"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";

/** Two-pane inbox on desktop; list OR thread on mobile (full-screen chat). */
export function MessagesShell({ list, children }: { list: React.ReactNode; children: React.ReactNode }) {
  const active = useSelectedLayoutSegment();
  return (
    <div
      className={cn(
        "grid overflow-hidden border-border bg-surface md:container-page md:my-6 md:h-[calc(100dvh-7rem)] md:grid-cols-[340px_1fr] md:rounded-3xl md:border md:p-0",
        active ? "fixed inset-x-0 bottom-0 top-16 z-40 md:static" : "min-h-[calc(100dvh-4rem-64px)]",
      )}
    >
      <aside className={cn("min-h-0 border-border md:block md:border-r", active ? "hidden" : "block")}>{list}</aside>
      <section className={cn("min-h-0 min-w-0", active ? "block" : "hidden md:block")}>{children}</section>
    </div>
  );
}
