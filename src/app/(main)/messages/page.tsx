import { MessagesSquare } from "lucide-react";

export default function MessagesIndex() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-10 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-accent/20 blur-2xl" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border-strong bg-elevated">
          <MessagesSquare className="size-7 text-accent" />
        </div>
      </div>
      <h2 className="text-lg font-semibold">Your conversations</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted">Select a conversation to read messages, respond to offers, and review trade proposals.</p>
    </div>
  );
}
