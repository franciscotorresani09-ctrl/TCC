"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/server/actions/social";
import { useViewer } from "@/components/providers/viewer-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  kind = "vehicle",
  targetId,
  initial,
  variant = "glass",
  className,
  label,
}: {
  kind?: "vehicle" | "event" | "seller";
  targetId: string;
  initial: boolean;
  variant?: "glass" | "outline";
  className?: string;
  label?: boolean;
}) {
  const viewer = useViewer();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [favorited, setOptimistic] = useOptimistic(initial);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!viewer) {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    startTransition(async () => {
      setOptimistic(!favorited);
      const res = await toggleFavoriteAction(kind, targetId);
      if (!res.ok) toast({ title: res.error, tone: "error" });
      else if (res.data.favorited) toast({ title: "Saved to favorites", href: "/favorites" });
      router.refresh();
    });
  };

  const text = favorited ? "Saved" : "Save";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      disabled={pending}
      className={cn(
        "group/fav inline-flex items-center justify-center gap-2 transition-all active:scale-90",
        variant === "glass" && "size-9 rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-md hover:bg-black/70",
        variant === "outline" && "h-11 rounded-xl border border-border-strong px-4 text-sm font-medium hover:bg-surface-2",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4.5 transition-all duration-300",
          favorited ? "scale-110 fill-accent text-accent" : "group-hover/fav:scale-110",
        )}
      />
      {label && <span>{text}</span>}
    </button>
  );
}
