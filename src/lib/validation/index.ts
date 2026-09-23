import { z } from "zod";
import {
  BODY_TYPES,
  CATEGORIES,
  CONDITIONS,
  DRIVETRAINS,
  EVENT_TYPES,
  FUEL_TYPES,
  MAX_IMAGES_PER_LISTING,
  REPORT_REASONS,
  TRANSMISSIONS,
} from "@/lib/constants";

const currentYear = new Date().getFullYear();

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(min, min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v.startsWith("/uploads/") || /^https:\/\/(images\.unsplash\.com|res\.cloudinary\.com)\//.test(v), {
    message: "Invalid image.",
  });

// ── Auth ─────────────────────────────────────────────────────

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.")
  .regex(/[a-z]/i, "Password must include a letter.")
  .regex(/\d/, "Password must include a number.");

export const signUpSchema = z.object({
  name: trimmed(2, 60, "Name"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be 24 characters or fewer.")
    .regex(/^[a-z0-9_]+$/, "Use only letters, numbers, and underscores."),
  email: z.email("Enter a valid email address.").trim().toLowerCase().max(254),
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Password is required.").max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

// ── Profile ──────────────────────────────────────────────────

export const profileSchema = z.object({
  name: trimmed(2, 60, "Name"),
  bio: optionalText(400),
  city: optionalText(60),
  state: optionalText(40),
  country: optionalText(60),
  image: imageUrl.optional().or(z.literal("").transform(() => undefined)),
});

export const garageVehicleSchema = z.object({
  make: trimmed(1, 40, "Make"),
  model: trimmed(1, 60, "Model"),
  year: z.coerce.number().int().min(1900).max(currentYear + 1),
  image: imageUrl.optional(),
  notes: optionalText(200),
});

// ── Vehicles ─────────────────────────────────────────────────

export const vehicleInfoSchema = z.object({
  category: z.enum(CATEGORIES.map((c) => c.slug) as [string, ...string[]], { error: "Choose a category." }),
  make: trimmed(1, 40, "Make"),
  model: trimmed(1, 60, "Model"),
  trim: optionalText(60),
  year: z.coerce
    .number({ error: "Year is required." })
    .int()
    .min(1900, "Enter a valid year.")
    .max(currentYear + 1, "Enter a valid year."),
  mileage: z.coerce.number({ error: "Mileage is required." }).int().min(0, "Mileage can't be negative.").max(2_000_000),
  price: z.coerce.number({ error: "Price is required." }).int().min(1, "Enter a price.").max(50_000_000),
  condition: z.enum(CONDITIONS.values, { error: "Select a condition." }),
  bodyType: z.enum(BODY_TYPES.values, { error: "Select a body type." }),
  transmission: z.enum(TRANSMISSIONS.values, { error: "Select a transmission." }),
  fuelType: z.enum(FUEL_TYPES.values, { error: "Select a fuel type." }),
  engine: trimmed(1, 80, "Engine"),
  drivetrain: z.enum(DRIVETRAINS.values, { error: "Select a drivetrain." }),
  exteriorColor: optionalText(40),
  interiorColor: optionalText(40),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-HJ-NPR-Z0-9]{11,17}$/, "Enter a valid VIN.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const vehiclePhotosSchema = z.object({
  images: z
    .array(imageUrl)
    .min(1, "Add at least one photo.")
    .max(MAX_IMAGES_PER_LISTING, `You can upload up to ${MAX_IMAGES_PER_LISTING} photos.`),
});

export const vehicleDescriptionSchema = z.object({
  description: trimmed(30, 5000, "Description"),
  features: z.array(z.string().trim().min(1).max(40)).max(40).default([]),
  openToTrade: z.boolean().default(true),
});

export const vehicleLocationSchema = z.object({
  country: trimmed(2, 60, "Country"),
  state: trimmed(2, 40, "State"),
  city: trimmed(2, 60, "City"),
  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9 -]{3,10}$/, "Enter a valid ZIP or postal code."),
});

export const createVehicleSchema = vehicleInfoSchema
  .extend(vehiclePhotosSchema.shape)
  .extend(vehicleDescriptionSchema.shape)
  .extend(vehicleLocationSchema.shape);
export type CreateVehicleInput = z.input<typeof createVehicleSchema>;

// ── Offers & trades ──────────────────────────────────────────

export const offerSchema = z.object({
  vehicleId: z.string().min(1).max(40),
  amount: z.coerce.number().int().min(1, "Enter an offer amount.").max(50_000_000),
  message: optionalText(500),
});

export const counterOfferSchema = z.object({
  offerId: z.string().min(1).max(40),
  amount: z.coerce.number().int().min(1).max(50_000_000),
});

export const tradeProposalSchema = z.object({
  offeredVehicleId: z.string().min(1, "Select one of your vehicles.").max(40),
  requestedVehicleId: z.string().min(1).max(40),
  cashDifference: z.coerce.number().int().min(-10_000_000).max(10_000_000).default(0),
  message: optionalText(1000),
});

// ── Messaging ────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1).max(40),
  content: z.string().trim().min(1, "Message can't be empty.").max(4000, "Message is too long."),
});

export const startConversationSchema = z.object({
  recipientId: z.string().min(1).max(40),
  vehicleId: z.string().max(40).optional(),
  content: z.string().trim().min(1, "Message can't be empty.").max(4000),
});

// ── Events ───────────────────────────────────────────────────

export const eventSchema = z
  .object({
    title: trimmed(4, 100, "Event name"),
    description: trimmed(20, 5000, "Description"),
    type: z.enum(EVENT_TYPES.values, { error: "Select an event type." }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time."),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose an end time."),
    venue: trimmed(2, 120, "Location"),
    city: trimmed(2, 60, "City"),
    state: trimmed(2, 40, "State"),
    country: trimmed(2, 60, "Country"),
    coverImage: imageUrl,
    maxAttendees: z.coerce
      .number()
      .int()
      .min(2, "Allow at least 2 attendees.")
      .max(100_000)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
  })
  .refine((d) => d.endTime > d.startTime, { message: "End time must be after the start time.", path: ["endTime"] })
  .refine((d) => new Date(`${d.date}T${d.startTime}:00`) > new Date(), {
    message: "The event must start in the future.",
    path: ["date"],
  });
export type EventInput = z.input<typeof eventSchema>;

// ── Community ────────────────────────────────────────────────

export const reviewSchema = z.object({
  targetUserId: z.string().min(1).max(40),
  rating: z.coerce.number().int().min(1, "Choose a rating.").max(5),
  comment: trimmed(10, 1000, "Review"),
});

export const reportSchema = z.object({
  vehicleId: z.string().max(40).optional(),
  eventId: z.string().max(40).optional(),
  targetUserId: z.string().max(40).optional(),
  reviewId: z.string().max(40).optional(),
  reason: z.enum(REPORT_REASONS.values, { error: "Choose a reason." }),
  details: optionalText(1000),
});

/** Map zod issues to a flat `{ field: message }` object for forms. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
