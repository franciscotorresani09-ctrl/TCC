"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useAction } from "@/hooks/use-action";
import { changePasswordAction, updateProfileAction } from "@/server/actions/social";
import { uploadImage, validateImageFile } from "@/components/sell/photo-uploader";
import { PasswordInput } from "@/components/auth/password-input";
import { COUNTRIES, US_STATES } from "@/lib/geo";

export function ProfileForm({ user }: { user: { name: string | null; bio: string | null; city: string | null; state: string | null; country: string | null; image: string | null } }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name ?? "", bio: user.bio ?? "", city: user.city ?? "", state: user.state ?? "", country: user.country ?? "United States", image: user.image ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const { pending, execute } = useAction();

  const onAvatar = async (file?: File) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) return toast({ title: problem, tone: "error" });
    setUploading(true);
    try {
      const url = await uploadImage(file, "avatars");
      setForm((f) => ({ ...f, image: url }));
    } catch (e) {
      toast({ title: (e as Error).message, tone: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        execute(() => updateProfileAction({ ...form, image: form.image.startsWith("http") || form.image.startsWith("/uploads/") ? form.image : undefined }), {
          onSuccess: () => {
            setErrors({});
            router.refresh();
          },
          onError: (r) => setErrors(r.fieldErrors ?? {}),
        });
      }}
    >
      <div className="flex items-center gap-4">
        <label className="group relative cursor-pointer">
          <Avatar src={form.image || null} name={form.name} size="xl" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
            {uploading ? <Spinner /> : <Camera className="size-6" />}
          </span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => onAvatar(e.target.files?.[0])} aria-label="Upload profile picture" />
        </label>
        <div className="text-sm text-muted">
          <p className="font-medium text-fg">Profile picture</p>
          <p>Click the photo to upload a new one. Square images work best.</p>
        </div>
      </div>
      <Field label="Name" error={errors.name}>
        {(p) => <Input {...p} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} />}
      </Field>
      <Field label="Bio" optional error={errors.bio} hint={`${form.bio.length}/400`}>
        {(p) => <Textarea {...p} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={400} placeholder="Tell the community about yourself and your cars." />}
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="City" optional>
          {(p) => <Input {...p} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={60} />}
        </Field>
        <Field label="State" optional>
          {(p) => (
            <Select {...p} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Country" optional>
          {(p) => (
            <Select {...p} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Button type="submit" loading={pending} disabled={uploading}>
        Save changes
      </Button>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const { pending, execute } = useAction();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        execute(() => changePasswordAction({ current, next }), {
          onSuccess: () => {
            setCurrent("");
            setNext("");
          },
        });
      }}
    >
      {hasPassword && (
        <Field label="Current password">{(p) => <PasswordInput {...p} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />}</Field>
      )}
      <Field label="New password" hint="At least 8 characters, including a letter and a number.">
        {(p) => <PasswordInput {...p} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />}
      </Field>
      <Button type="submit" variant="secondary" loading={pending}>
        {hasPassword ? "Update password" : "Set password"}
      </Button>
    </form>
  );
}
