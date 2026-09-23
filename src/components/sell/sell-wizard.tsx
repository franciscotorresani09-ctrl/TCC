"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileText, Image as ImageIcon, MapPin, Rocket, Car, Plus, X, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { PhotoUploader } from "./photo-uploader";
import { createVehicleAction, updateVehicleAction } from "@/server/actions/vehicles";
import {
  BODY_TYPES,
  CATEGORIES,
  COMMON_FEATURES,
  CONDITIONS,
  DRIVETRAINS,
  FUEL_TYPES,
  MAKES,
  TRANSMISSIONS,
} from "@/lib/constants";
import { COUNTRIES, US_STATES } from "@/lib/geo";
import { fieldErrors, vehicleDescriptionSchema, vehicleInfoSchema, vehicleLocationSchema, vehiclePhotosSchema, type CreateVehicleInput } from "@/lib/validation";
import { cn, formatNumber, formatPrice } from "@/lib/utils";

export interface SellFormState {
  category: string;
  make: string;
  model: string;
  trim: string;
  year: string;
  mileage: string;
  price: string;
  condition: string;
  bodyType: string;
  transmission: string;
  fuelType: string;
  engine: string;
  drivetrain: string;
  exteriorColor: string;
  interiorColor: string;
  vin: string;
  images: string[];
  description: string;
  features: string[];
  openToTrade: boolean;
  country: string;
  state: string;
  city: string;
  postalCode: string;
}

export const EMPTY_SELL_FORM: SellFormState = {
  category: "", make: "", model: "", trim: "", year: "", mileage: "", price: "", condition: "", bodyType: "", transmission: "",
  fuelType: "", engine: "", drivetrain: "", exteriorColor: "", interiorColor: "", vin: "", images: [], description: "",
  features: [], openToTrade: true, country: "United States", state: "", city: "", postalCode: "",
};

const STEPS = [
  { key: "info", label: "Vehicle Information", short: "Vehicle", icon: Car, schema: vehicleInfoSchema },
  { key: "photos", label: "Photos", short: "Photos", icon: ImageIcon, schema: vehiclePhotosSchema },
  { key: "description", label: "Description", short: "Details", icon: FileText, schema: vehicleDescriptionSchema },
  { key: "location", label: "Location", short: "Location", icon: MapPin, schema: vehicleLocationSchema },
  { key: "review", label: "Review", short: "Review", icon: Rocket, schema: null },
] as const;

const DRAFT_KEY = "street-car:sell-draft";

export function SellWizard({ initial, editId, sellerName }: { initial?: SellFormState; editId?: string; sellerName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<SellFormState>(initial ?? EMPTY_SELL_FORM);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [customFeature, setCustomFeature] = useState("");

  // Restore / persist an unsent draft for new listings (per-browser convenience).
  useEffect(() => {
    if (editId) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      // Syncing from an external store (localStorage) after hydration is intentional here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setForm({ ...EMPTY_SELL_FORM, ...JSON.parse(saved) });
    } catch {
      /* storage unavailable */
    }
  }, [editId]);
  useEffect(() => {
    if (editId) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* storage unavailable */
    }
  }, [form, editId]);

  const set = <K extends keyof SellFormState>(key: K, value: SellFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const payload = useMemo(
    () =>
      ({
        ...form,
        year: form.year,
        mileage: form.mileage,
        price: form.price,
        trim: form.trim || undefined,
        exteriorColor: form.exteriorColor || undefined,
        interiorColor: form.interiorColor || undefined,
        vin: form.vin || undefined,
      }) as unknown as CreateVehicleInput,
    [form],
  );

  const validate = (i: number) => {
    const schema = STEPS[i]!.schema;
    if (!schema) return true;
    const res = schema.safeParse(payload);
    if (res.success) {
      setErrors({});
      return true;
    }
    setErrors(fieldErrors(res.error));
    toast({ title: "Please fix the highlighted fields.", tone: "error" });
    return false;
  };

  const next = () => {
    if (!validate(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goTo = (i: number) => {
    if (i < step) return setStep(i);
    for (let s = step; s < i; s++) if (!validate(s)) return setStep(s);
    setStep(i);
  };

  const publish = async () => {
    for (let s = 0; s < STEPS.length - 1; s++) if (!validate(s)) return setStep(s);
    setSubmitting(true);
    const res = editId ? await updateVehicleAction(editId, payload) : await createVehicleAction(payload);
    setSubmitting(false);
    if (!res.ok) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      toast({ title: res.error, tone: "error" });
      return;
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    toast({ title: res.message ?? "Listing published!" });
    router.push(`/vehicles/${res.data.slug}`);
    router.refresh();
  };

  const preview = {
    id: "preview",
    slug: "#",
    make: form.make || "Make",
    model: form.model || "Model",
    trim: form.trim || null,
    year: Number(form.year) || new Date().getFullYear(),
    price: Number(form.price) || 0,
    mileage: Number(form.mileage) || 0,
    city: form.city || "City",
    state: form.state || "ST",
    condition: (form.condition || "USED") as "USED",
    fuelType: (form.fuelType || "GASOLINE") as "GASOLINE",
    transmission: (form.transmission || "AUTOMATIC") as "AUTOMATIC",
    status: "ACTIVE" as const,
    isFeatured: false,
    openToTrade: form.openToTrade,
    createdAt: new Date(),
    images: form.images[0] ? [{ url: form.images[0], alt: null }] : [],
    seller: { id: "me", name: sellerName, username: null, sellerType: "PRIVATE" as const },
  };

  const numeric = (key: "year" | "mileage" | "price", max: number) => ({
    inputMode: "numeric" as const,
    value: form[key] ? (key === "year" ? form[key] : Number(form[key]).toLocaleString("en-US")) : "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value.replace(/[^0-9]/g, "").slice(0, max)),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      {/* Stepper */}
      <nav aria-label="Listing steps" className="lg:sticky lg:top-24 lg:self-start">
        <ol className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                    active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border transition",
                      active && "border-accent bg-accent text-white",
                      done && "border-success/40 bg-success/15 text-success",
                      !active && !done && "border-border",
                    )}
                  >
                    {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <span className="hidden font-medium sm:inline lg:hidden">{s.short}</span>
                  <span className="hidden font-medium lg:inline">
                    <span className="block text-[11px] font-normal text-subtle">Step {i + 1}</span>
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-4 hidden h-1 overflow-hidden rounded-full bg-border lg:block">
          <div className="h-full bg-accent-gradient transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </nav>

      <div className="min-w-0">
        <div key={step} className="animate-fade-up rounded-3xl border border-border bg-surface p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{STEPS[step]!.label}</h2>

          <div className="mt-6">
            {step === 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Category" error={errors.category} className="sm:col-span-2">
                  {(p) => (
                    <div {...p} role="radiogroup" className="flex flex-wrap gap-2">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c.slug}
                          type="button"
                          role="radio"
                          aria-checked={form.category === c.slug}
                          onClick={() => {
                            set("category", c.slug);
                            if (c.slug === "motorcycles") set("bodyType", "MOTORCYCLE");
                            if (c.slug === "electric-vehicles") set("fuelType", "ELECTRIC");
                          }}
                          className={cn(
                            "rounded-full border px-3.5 py-2 text-sm transition active:scale-95",
                            form.category === c.slug ? "border-accent bg-accent-soft text-fg" : "border-border text-muted hover:border-border-strong hover:text-fg",
                          )}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </Field>
                <Field label="Make" error={errors.make}>
                  {(p) => (
                    <>
                      <Input {...p} list="makes" value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="e.g. BMW" maxLength={40} />
                      <datalist id="makes">
                        {MAKES.map((m) => (
                          <option key={m} value={m} />
                        ))}
                      </datalist>
                    </>
                  )}
                </Field>
                <Field label="Model" error={errors.model}>
                  {(p) => <Input {...p} value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. M3" maxLength={60} />}
                </Field>
                <Field label="Trim" optional error={errors.trim}>
                  {(p) => <Input {...p} value={form.trim} onChange={(e) => set("trim", e.target.value)} placeholder="e.g. Competition xDrive" maxLength={60} />}
                </Field>
                <Field label="Year" error={errors.year}>
                  {(p) => <Input {...p} {...numeric("year", 4)} placeholder="2024" />}
                </Field>
                <Field label="Mileage" error={errors.mileage}>
                  {(p) => <Input {...p} {...numeric("mileage", 7)} placeholder="12,400" suffix="mi" />}
                </Field>
                <Field label="Price" error={errors.price}>
                  {(p) => <Input {...p} {...numeric("price", 8)} placeholder="82,500" icon={<span className="text-sm">$</span>} />}
                </Field>
                <Field label="Condition" error={errors.condition}>
                  {(p) => (
                    <Select {...p} value={form.condition} onChange={(e) => set("condition", e.target.value)}>
                      <option value="">Select condition</option>
                      {CONDITIONS.list.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Body type" error={errors.bodyType}>
                  {(p) => (
                    <Select {...p} value={form.bodyType} onChange={(e) => set("bodyType", e.target.value)}>
                      <option value="">Select body type</option>
                      {BODY_TYPES.list.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Transmission" error={errors.transmission}>
                  {(p) => (
                    <Select {...p} value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
                      <option value="">Select transmission</option>
                      {TRANSMISSIONS.list.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Fuel type" error={errors.fuelType}>
                  {(p) => (
                    <Select {...p} value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)}>
                      <option value="">Select fuel type</option>
                      {FUEL_TYPES.list.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Engine" error={errors.engine}>
                  {(p) => <Input {...p} value={form.engine} onChange={(e) => set("engine", e.target.value)} placeholder="e.g. 3.0L Twin-Turbo I6 · 503 hp" maxLength={80} />}
                </Field>
                <Field label="Drivetrain" error={errors.drivetrain}>
                  {(p) => (
                    <Select {...p} value={form.drivetrain} onChange={(e) => set("drivetrain", e.target.value)}>
                      <option value="">Select drivetrain</option>
                      {DRIVETRAINS.list.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Exterior color" optional>
                  {(p) => <Input {...p} value={form.exteriorColor} onChange={(e) => set("exteriorColor", e.target.value)} placeholder="e.g. Isle of Man Green" maxLength={40} />}
                </Field>
                <Field label="Interior color" optional>
                  {(p) => <Input {...p} value={form.interiorColor} onChange={(e) => set("interiorColor", e.target.value)} placeholder="e.g. Black leather" maxLength={40} />}
                </Field>
                <Field label="VIN" optional error={errors.vin} hint="Never shown in full to buyers without your consent." className="sm:col-span-2">
                  {(p) => <Input {...p} value={form.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} placeholder="17-character VIN" maxLength={17} className="font-mono uppercase" />}
                </Field>
              </div>
            )}

            {step === 1 && <PhotoUploader value={form.images} onChange={(imgs) => set("images", imgs)} error={errors.images} />}

            {step === 2 && (
              <div className="space-y-6">
                <Field label="Description" error={errors.description} hint={`${form.description.length}/5000 · Mention history, maintenance, modifications, and any flaws.`}>
                  {(p) => (
                    <Textarea
                      {...p}
                      rows={8}
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      maxLength={5000}
                      placeholder="One-owner, garage kept, full service records. Recently replaced tires and brakes…"
                    />
                  )}
                </Field>
                <div>
                  <p className="mb-2 text-sm font-medium">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set([...COMMON_FEATURES, ...form.features])).map((f) => {
                      const on = form.features.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          aria-pressed={on}
                          onClick={() => set("features", on ? form.features.filter((x) => x !== f) : [...form.features, f])}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95",
                            on ? "border-accent bg-accent-soft text-fg" : "border-border text-muted hover:text-fg",
                          )}
                        >
                          {on && <Check className="size-3" />} {f}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex max-w-sm gap-2">
                    <Input
                      aria-label="Add a custom feature"
                      value={customFeature}
                      onChange={(e) => setCustomFeature(e.target.value)}
                      placeholder="Add a custom feature"
                      maxLength={40}
                      className="h-10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const f = customFeature.trim();
                          if (f && !form.features.includes(f)) set("features", [...form.features, f]);
                          setCustomFeature("");
                        }
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-10"
                      aria-label="Add feature"
                      onClick={() => {
                        const f = customFeature.trim();
                        if (f && !form.features.includes(f)) set("features", [...form.features, f]);
                        setCustomFeature("");
                      }}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition hover:border-border-strong">
                  <input type="checkbox" checked={form.openToTrade} onChange={(e) => set("openToTrade", e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-accent)]" />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <ArrowLeftRight className="size-4 text-accent" /> Open to trades
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">Let buyers send you trade proposals with their vehicles plus optional cash.</span>
                  </span>
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Country" error={errors.country}>
                  {(p) => (
                    <Select {...p} value={form.country} onChange={(e) => set("country", e.target.value)}>
                      {COUNTRIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="State / Province" error={errors.state}>
                  {(p) =>
                    form.country === "United States" ? (
                      <Select {...p} value={form.state} onChange={(e) => set("state", e.target.value)}>
                        <option value="">Select state</option>
                        {US_STATES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </Select>
                    ) : (
                      <Input {...p} value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={40} />
                    )
                  }
                </Field>
                <Field label="City" error={errors.city}>
                  {(p) => <Input {...p} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Miami" maxLength={60} />}
                </Field>
                <Field label="ZIP / Postal code" error={errors.postalCode}>
                  {(p) => <Input {...p} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="e.g. 33101" maxLength={10} />}
                </Field>
                <p className="text-xs text-subtle sm:col-span-2">Only your city and state are shown publicly. Your exact address is never shared.</p>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-8 md:grid-cols-[320px_1fr]">
                <div>
                  <p className="mb-3 text-sm font-medium text-muted">Card preview</p>
                  <div className="pointer-events-none">
                    <VehicleCard vehicle={preview} />
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium text-muted">Listing summary</p>
                  <dl className="divide-y divide-border rounded-2xl border border-border">
                    {[
                      ["Vehicle", [form.year, form.make, form.model, form.trim].filter(Boolean).join(" ")],
                      ["Price", form.price ? formatPrice(Number(form.price)) : "—"],
                      ["Mileage", form.mileage ? `${formatNumber(Number(form.mileage))} miles` : "—"],
                      ["Condition", CONDITIONS.labels[form.condition as keyof typeof CONDITIONS.labels] ?? "—"],
                      ["Body type", BODY_TYPES.labels[form.bodyType as keyof typeof BODY_TYPES.labels] ?? "—"],
                      ["Transmission", TRANSMISSIONS.labels[form.transmission as keyof typeof TRANSMISSIONS.labels] ?? "—"],
                      ["Fuel type", FUEL_TYPES.labels[form.fuelType as keyof typeof FUEL_TYPES.labels] ?? "—"],
                      ["Engine", form.engine || "—"],
                      ["Drivetrain", DRIVETRAINS.labels[form.drivetrain as keyof typeof DRIVETRAINS.labels] ?? "—"],
                      ["Photos", `${form.images.length} uploaded`],
                      ["Location", [form.city, form.state, form.postalCode].filter(Boolean).join(", ")],
                      ["Trades", form.openToTrade ? "Open to trades" : "Not accepting trades"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                        <dt className="text-muted">{k}</dt>
                        <dd className="text-right font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 line-clamp-4 text-sm text-muted">{form.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer nav — sticks above the mobile tab bar */}
        <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 -mx-4 mt-4 flex items-center justify-between gap-3 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur-xl md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next} size="lg">
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={publish} size="lg" loading={submitting}>
              <Rocket className="size-4" /> {editId ? "Save Changes" : "Publish Listing"}
            </Button>
          )}
        </div>
        {!editId && step === 0 && (
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_SELL_FORM);
              setErrors({});
            }}
            className="mt-4 inline-flex items-center gap-1 text-xs text-subtle hover:text-fg"
          >
            <X className="size-3" /> Clear saved draft
          </button>
        )}
      </div>
    </div>
  );
}
