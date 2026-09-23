"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { CarFront } from "lucide-react";
import { cn } from "@/lib/utils";

/** next/image with a branded fallback when the source fails to load. */
export function SafeImage({ className, alt, fallbackClassName, ...props }: ImageProps & { fallbackClassName?: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed || !props.src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-elevated via-surface-2 to-bg",
          props.fill ? "absolute inset-0" : "",
          fallbackClassName,
        )}
      >
        <CarFront className="size-10 text-border-strong" strokeWidth={1.25} />
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={cn("transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0", className)}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
