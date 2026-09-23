"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Hero backdrop that gracefully degrades to the gradient scene if the photo can't load. */
export function HeroImage({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  if (state === "error") return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      sizes="100vw"
      onLoad={() => setState("loaded")}
      onError={() => setState("error")}
      className={cn("object-cover object-center transition-all duration-[1.6s] ease-out", state === "loaded" ? "scale-100 opacity-100" : "scale-105 opacity-0")}
    />
  );
}
