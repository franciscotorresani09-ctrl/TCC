"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

export function Gallery({ images, title }: { images: { url: string; alt: string | null }[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = images.length;
  const thumbs = useRef<HTMLDivElement>(null);

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useEffect(() => {
    thumbs.current?.children[index]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
  }, [lightbox]);

  if (!count) {
    return <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border bg-surface-2"><SafeImage src="" alt={title} fill /></div>;
  }

  const current = images[index]!;
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => (touchX.current = e.touches[0]!.clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current === null) return;
      const dx = e.changedTouches[0]!.clientX - touchX.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      touchX.current = null;
    },
  };

  const renderArrows = (big?: boolean) =>
    count > 1 ? (
      <>
        {[-1, 1].map((d) => (
          <button
            key={d}
            onClick={(e) => {
              e.stopPropagation();
              go(d);
            }}
            aria-label={d < 0 ? "Previous photo" : "Next photo"}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md transition hover:bg-black/80 active:scale-90",
              big ? "p-3" : "p-2 opacity-0 group-hover:opacity-100 max-sm:hidden",
              d < 0 ? "left-3" : "right-3",
            )}
          >
            {d < 0 ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
          </button>
        ))}
      </>
    ) : null;

  return (
    <div>
      <div
        className="group relative -mx-4 aspect-[4/3] cursor-zoom-in overflow-hidden bg-surface-2 sm:mx-0 sm:aspect-[16/10] sm:rounded-3xl sm:border sm:border-border"
        onClick={() => setLightbox(true)}
        {...swipe}
      >
        <SafeImage key={current.url} src={current.url} alt={current.alt ?? title} fill priority sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover animate-fade-in" />
        {renderArrows()}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
            {index + 1} / {count}
          </span>
          <span className="rounded-full bg-black/60 p-1.5 text-white backdrop-blur-md">
            <Expand className="size-3.5" />
          </span>
        </div>
      </div>

      {count > 1 && (
        <div ref={thumbs} className="scrollbar-none mt-3 flex gap-2 overflow-x-auto" role="tablist" aria-label="Photos">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl border-2 transition sm:w-28",
                i === index ? "border-accent" : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <SafeImage src={img.url} alt="" fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox &&
        createPortal(
          <div className="fixed inset-0 z-[150] flex flex-col bg-black/95 animate-fade-in" role="dialog" aria-modal="true" aria-label={`${title} photos`}>
            <div className="flex items-center justify-between p-4 text-sm text-white/80">
              <span>
                {index + 1} / {count}
              </span>
              <button onClick={() => setLightbox(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="Close gallery">
                <X className="size-6" />
              </button>
            </div>
            <div className="relative flex-1" {...swipe}>
              <SafeImage key={current.url} src={current.url} alt={current.alt ?? title} fill sizes="100vw" className="object-contain animate-fade-in" />
              {renderArrows(true)}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
