import { Bike, Bus, Car, Crown, Gauge, Mountain, Truck, Wrench, Zap, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  cars: Car,
  motorcycles: Bike,
  trucks: Truck,
  suvs: Mountain,
  vans: Bus,
  "classic-cars": Crown,
  "sports-cars": Gauge,
  "electric-vehicles": Zap,
  "parts-accessories": Wrench,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Car;
  return <Icon className={className} />;
}
