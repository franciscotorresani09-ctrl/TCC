// Client-safe option lists and labels. These mirror the Prisma enums so that
// client components never import @prisma/client.

export const SITE = {
  name: "Street-Car",
  tagline: "Everything automotive. One place.",
  description:
    "Buy, sell, trade, connect, and discover automotive events with a community built for people who love cars.",
};

function options<T extends string>(map: Record<T, string>) {
  const values = Object.keys(map) as T[];
  return {
    values: values as [T, ...T[]],
    labels: map,
    list: values.map((value) => ({ value, label: map[value] })),
  };
}

export const CONDITIONS = options({ NEW: "New", USED: "Used", CERTIFIED: "Certified" });
export type Condition = (typeof CONDITIONS.values)[number];

export const BODY_TYPES = options({
  SEDAN: "Sedan",
  COUPE: "Coupe",
  SUV: "SUV",
  PICKUP: "Pickup",
  HATCHBACK: "Hatchback",
  CONVERTIBLE: "Convertible",
  WAGON: "Wagon",
  VAN: "Van",
  MOTORCYCLE: "Motorcycle",
  OTHER: "Other",
});
export type BodyTypeValue = (typeof BODY_TYPES.values)[number];

export const TRANSMISSIONS = options({ AUTOMATIC: "Automatic", MANUAL: "Manual" });
export type TransmissionValue = (typeof TRANSMISSIONS.values)[number];

export const FUEL_TYPES = options({ GASOLINE: "Gasoline", DIESEL: "Diesel", HYBRID: "Hybrid", ELECTRIC: "Electric" });
export type FuelTypeValue = (typeof FUEL_TYPES.values)[number];

export const DRIVETRAINS = options({ FWD: "Front-wheel drive", RWD: "Rear-wheel drive", AWD: "All-wheel drive", FOUR_WD: "4x4" });
export type DrivetrainValue = (typeof DRIVETRAINS.values)[number];

export const LISTING_STATUSES = options({
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  SOLD: "Sold",
  REMOVED: "Removed",
});
export type ListingStatusValue = (typeof LISTING_STATUSES.values)[number];

export const SELLER_TYPES = options({ PRIVATE: "Private seller", DEALER: "Dealership" });

export const EVENT_TYPES = options({
  CAR_MEET: "Car Meet",
  CAR_SHOW: "Car Show",
  TRACK_DAY: "Track Day",
  RACING: "Racing",
  CARS_AND_COFFEE: "Cars & Coffee",
  TUNING: "Tuning",
  MOTORCYCLE_MEET: "Motorcycle Meet",
  CLUB: "Club Event",
});
export type EventTypeValue = (typeof EVENT_TYPES.values)[number];

export const OFFER_STATUSES = options({
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  COUNTERED: "Countered",
  WITHDRAWN: "Withdrawn",
});
export type OfferStatusValue = (typeof OFFER_STATUSES.values)[number];

export const TRADE_STATUSES = options({
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  COUNTER_OFFER: "Counter Offer",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
});
export type TradeStatusValue = (typeof TRADE_STATUSES.values)[number];

export const REPORT_REASONS = options({
  SCAM: "Suspected scam or fraud",
  MISLEADING: "Misleading information",
  PROHIBITED: "Prohibited item",
  DUPLICATE: "Duplicate listing",
  OFFENSIVE: "Offensive content",
  OTHER: "Something else",
});
export type ReportReasonValue = (typeof REPORT_REASONS.values)[number];

/** Vehicle categories. Slugs match the seeded Category rows. */
export const CATEGORIES = [
  { slug: "cars", name: "Cars", icon: "car" },
  { slug: "motorcycles", name: "Motorcycles", icon: "bike" },
  { slug: "trucks", name: "Trucks", icon: "truck" },
  { slug: "suvs", name: "SUVs", icon: "mountain" },
  { slug: "vans", name: "Vans", icon: "bus" },
  { slug: "classic-cars", name: "Classic Cars", icon: "crown" },
  { slug: "sports-cars", name: "Sports Cars", icon: "gauge" },
  { slug: "electric-vehicles", name: "Electric Vehicles", icon: "zap" },
  { slug: "parts-accessories", name: "Parts & Accessories", icon: "wrench" },
] as const;
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
  "Dodge", "Ducati", "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Harley-Davidson", "Honda", "Hyundai", "Infiniti",
  "Jaguar", "Jeep", "Kawasaki", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Lotus", "Lucid", "Maserati",
  "Mazda", "McLaren", "Mercedes-Benz", "MINI", "Mitsubishi", "Nissan", "Polestar", "Porsche", "Ram", "Rivian",
  "Rolls-Royce", "Subaru", "Suzuki", "Tesla", "Toyota", "Triumph", "Volkswagen", "Volvo", "Yamaha",
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "mileage", label: "Mileage" },
  { value: "views", label: "Most Viewed" },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const RADIUS_OPTIONS = [10, 25, 50, 100, 250, 500] as const;

export const COMMON_FEATURES = [
  "Navigation", "Apple CarPlay", "Android Auto", "Heated seats", "Ventilated seats", "Leather interior",
  "Sunroof", "Panoramic roof", "Backup camera", "360° camera", "Adaptive cruise control", "Lane keep assist",
  "Blind spot monitoring", "Keyless entry", "Premium audio", "Carbon ceramic brakes", "Sport exhaust",
  "Track package", "Tow package", "Head-up display", "Wireless charging", "Third-row seating",
] as const;

export const PAGE_SIZE = 12;
export const MAX_IMAGES_PER_LISTING = 20;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
