"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2, UploadCloud } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGES_PER_LISTING, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Pending {
  id: string;
  preview: string;
}

export async function uploadImage(file: File, folder: "vehicles" | "events" | "avatars") {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed. Please try again.");
  return data.url;
}

export function validateImageFile(file: File) {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return "Only JPEG, PNG, WebP, or AVIF images are allowed.";
  if (file.size > MAX_UPLOAD_BYTES) return "Images must be 8 MB or smaller.";
  return null;
}

/** Multi-image uploader with drag & drop, previews, reordering, delete, and primary selection. */
export function PhotoUploader({ value, onChange, error }: { value: string[]; onChange: (urls: string[]) => void; error?: string }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Uploads finish asynchronously; always append to the latest list.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const room = MAX_IMAGES_PER_LISTING - latest.current.length - pending.length;
    if (room <= 0) return toast({ title: `You can upload up to ${MAX_IMAGES_PER_LISTING} photos.`, tone: "error" });
    for (const file of list.slice(0, room)) {
      const problem = validateImageFile(file);
      if (problem) {
        toast({ title: problem, description: file.name, tone: "error" });
        continue;
      }
      const item = { id: crypto.randomUUID(), preview: URL.createObjectURL(file) };
      setPending((p) => [...p, item]);
      uploadImage(file, "vehicles")
        .then((url) => onChange([...latest.current, url]))
        .catch((e: Error) => toast({ title: e.message, tone: "error" }))
        .finally(() => {
          URL.revokeObjectURL(item.preview);
          setPending((p) => p.filter((x) => x.id !== item.id));
        });
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (e.dataTransfer.types.includes("Files")) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload photos"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all",
          dragOver ? "scale-[1.01] border-accent bg-accent-soft" : "border-border-strong bg-surface hover:border-subtle",
          error && "border-danger/60",
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-elevated">
          <UploadCloud className={cn("size-7 transition", dragOver ? "text-accent" : "text-muted")} />
        </span>
        <p className="mt-4 font-semibold">Drag & drop photos here</p>
        <p className="mt-1 text-sm text-muted">or click to browse · JPEG, PNG, WebP, AVIF · up to 8 MB each</p>
        <p className="mt-3 text-xs text-subtle">
          {value.length}/{MAX_IMAGES_PER_LISTING} photos · Tip: lead with a 3/4 front shot in good light
        </p>
        <input
          ref={input}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {(value.length > 0 || pending.length > 0) && (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((url, i) => (
            <li
              key={url}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={cn(
                "group relative aspect-[4/3] cursor-grab overflow-hidden rounded-2xl border bg-surface-2 transition active:cursor-grabbing animate-scale-in",
                i === 0 ? "border-accent" : "border-border",
                dragIndex === i && "opacity-40",
              )}
            >
              <SafeImage src={url} alt={`Photo ${i + 1}`} fill sizes="240px" className="object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">
                  <Star className="size-3 fill-current" /> Primary
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <div className="flex gap-1">
                  <IconBtn label="Move left" onClick={() => move(i, i - 1)} disabled={i === 0}>
                    <ArrowLeft />
                  </IconBtn>
                  <IconBtn label="Move right" onClick={() => move(i, i + 1)} disabled={i === value.length - 1}>
                    <ArrowRight />
                  </IconBtn>
                </div>
                <div className="flex gap-1">
                  {i !== 0 && (
                    <IconBtn label="Set as primary photo" onClick={() => move(i, 0)}>
                      <Star />
                    </IconBtn>
                  )}
                  <IconBtn label="Delete photo" danger onClick={() => onChange(value.filter((_, j) => j !== i))}>
                    <Trash2 />
                  </IconBtn>
                </div>
              </div>
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="size-full object-cover opacity-50" />
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner />
              </span>
            </li>
          ))}
          {value.length + pending.length < MAX_IMAGES_PER_LISTING && (
            <li>
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border-strong text-sm text-muted transition hover:border-accent hover:text-fg"
              >
                <ImagePlus className="size-5" /> Add more
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn("rounded-lg bg-black/60 p-1.5 text-white backdrop-blur transition hover:bg-black disabled:opacity-30 [&>svg]:size-3.5", danger && "hover:bg-danger")}
    >
      {children}
    </button>
  );
}
