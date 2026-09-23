"use client";

import Image from "next/image";
import { useState } from "react";
import { cn, initials } from "@/lib/utils";

const sizes = { xs: "size-6 text-[10px]", sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-base", xl: "size-24 text-2xl sm:size-28" };
const px = { xs: 24, sm: 32, md: 40, lg: 56, xl: 112 };

export function Avatar({
  src,
  name,
  size = "md",
  online,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof sizes;
  online?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src && !failed ? (
        <Image
          src={src}
          alt={name ?? "User avatar"}
          width={px[size]}
          height={px[size]}
          onError={() => setFailed(true)}
          className={cn("rounded-full object-cover ring-1 ring-white/10", sizes[size])}
        />
      ) : (
        <span
          aria-label={name ?? "User"}
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-elevated to-border-strong font-semibold text-fg ring-1 ring-white/10",
            sizes[size],
          )}
        >
          {initials(name)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-bg",
            online ? "bg-success" : "bg-subtle",
            size === "xl" && "size-4 ring-4",
          )}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </span>
  );
}
