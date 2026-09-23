"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Globe, ImagePlus, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { uploadImage, validateImageFile } from "@/components/sell/photo-uploader";
import { createEventAction } from "@/server/actions/events";
import { EVENT_TYPES } from "@/lib/constants";
import { COUNTRIES, US_STATES } from "@/lib/geo";
import { eventSchema, fieldErrors, type EventInput } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function EventForm() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    title: "", description: "", type: "", date: "", startTime: "09:00", endTime: "12:00", venue: "", city: "", state: "", country: "United States",
    coverImage: "", maxAttendees: "", visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const onCover = async (file?: File) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) return toast({ title: problem, tone: "error" });
    setUploading(true);
    try {
      set("coverImage", await uploadImage(file, "events"));
    } catch (e) {
      toast({ title: (e as Error).message, tone: "error" });
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = eventSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast({ title: "Please fix the highlighted fields.", tone: "error" });
      return;
    }
    setSubmitting(true);
    const res = await createEventAction(parsed.data as unknown as EventInput);
    setSubmitting(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      return toast({ title: res.error, tone: "error" });
    }
    toast({ title: res.message ?? "Event created!" });
    router.push(`/events/${res.data.slug}`);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]" noValidate>
      <div className="space-y-5 rounded-3xl border border-border bg-surface p-5 sm:p-8">
        <Field label="Event name" error={errors.title}>
          {(p) => <Input {...p} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Sunday Sunrise Cars & Coffee" maxLength={100} />}
        </Field>
        <Field label="Event type" error={errors.type}>
          {(p) => (
            <Select {...p} value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option value="">Select a type</option>
              {EVENT_TYPES.list.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Description" error={errors.description} hint="Share the schedule, parking details, and house rules.">
          {(p) => <Textarea {...p} rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={5000} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Date" error={errors.date}>
            {(p) => <Input {...p} type="date" min={today} value={form.date} onChange={(e) => set("date", e.target.value)} />}
          </Field>
          <Field label="Start time" error={errors.startTime}>
            {(p) => <Input {...p} type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />}
          </Field>
          <Field label="End time" error={errors.endTime}>
            {(p) => <Input {...p} type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />}
          </Field>
        </div>
        <Field label="Location" error={errors.venue} hint="Venue name or street address.">
          {(p) => <Input {...p} value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Bayfront Park North Lot" maxLength={120} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="City" error={errors.city}>
            {(p) => <Input {...p} value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={60} />}
          </Field>
          <Field label="State" error={errors.state}>
            {(p) =>
              form.country === "United States" ? (
                <Select {...p} value={form.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Select</option>
                  {US_STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              ) : (
                <Input {...p} value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={40} />
              )
            }
          </Field>
          <Field label="Country" error={errors.country}>
            {(p) => (
              <Select {...p} value={form.country} onChange={(e) => set("country", e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </div>

      <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-border bg-surface p-5">
          <p className="mb-2 text-sm font-medium">Cover image</p>
          <label
            className={cn(
              "relative flex aspect-[16/9] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed text-sm text-muted transition hover:border-accent",
              errors.coverImage ? "border-danger/60" : "border-border-strong",
            )}
          >
            {form.coverImage ? (
              <>
                <SafeImage src={form.coverImage} alt="Event cover" fill sizes="360px" className="object-cover" />
                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white">
                  <RefreshCw className="size-3" /> Replace
                </span>
              </>
            ) : uploading ? (
              <Spinner />
            ) : (
              <>
                <ImagePlus className="size-6" /> Upload a cover photo
              </>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => onCover(e.target.files?.[0])} />
          </label>
          {errors.coverImage && <p className="mt-1.5 text-xs text-danger">Add a cover image.</p>}
        </div>

        <div className="space-y-5 rounded-3xl border border-border bg-surface p-5">
          <Field label="Maximum attendees" optional error={errors.maxAttendees} hint="Leave empty for unlimited.">
            {(p) => <Input {...p} inputMode="numeric" value={form.maxAttendees} onChange={(e) => set("maxAttendees", e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} />}
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium">Visibility</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Visibility">
              {([
                ["PUBLIC", Globe, "Public", "Anyone can find it"],
                ["PRIVATE", Lock, "Private", "Only people with the link"],
              ] as const).map(([v, Icon, label, desc]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={form.visibility === v}
                  onClick={() => setForm((f) => ({ ...f, visibility: v }))}
                  className={cn("rounded-2xl border p-3 text-left transition", form.visibility === v ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong")}
                >
                  <Icon className="size-4 text-accent" />
                  <p className="mt-2 text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={uploading}>
          <CalendarPlus className="size-4" /> Create Event
        </Button>
      </div>
    </form>
  );
}
