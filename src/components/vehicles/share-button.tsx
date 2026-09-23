"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function ShareButton({ title, className, label = true }: { title: string; className?: string; label?: boolean }) {
  const toast = useToast();
  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") toast({ title: "Unable to share this link.", tone: "error" });
    }
  };
  return (
    <button
      type="button"
      onClick={onShare}
      className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong px-4 text-sm font-medium transition hover:bg-surface-2 active:scale-95", className)}
      aria-label="Share"
    >
      <Share2 className="size-4.5" />
      {label && "Share"}
    </button>
  );
}
