import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserPage } from "@/server/auth-guard";
import { getVehicleForEdit } from "@/server/services/vehicles";
import { SellWizard, type SellFormState } from "@/components/sell/sell-wizard";

export const metadata: Metadata = { title: "Sell Your Vehicle", description: "List your car, truck, or motorcycle on Street-Car in minutes." };

export default async function SellPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const user = await requireUserPage(edit ? `/sell?edit=${edit}` : "/sell");

  let initial: SellFormState | undefined;
  if (edit) {
    const v = await getVehicleForEdit(user.id, edit).catch(() => null);
    if (!v) notFound();
    initial = {
      category: v.category.slug,
      make: v.make,
      model: v.model,
      trim: v.trim ?? "",
      year: String(v.year),
      mileage: String(v.mileage),
      price: String(v.price),
      condition: v.condition,
      bodyType: v.bodyType,
      transmission: v.transmission,
      fuelType: v.fuelType,
      engine: v.engine,
      drivetrain: v.drivetrain,
      exteriorColor: v.exteriorColor ?? "",
      interiorColor: v.interiorColor ?? "",
      vin: v.vin ?? "",
      images: v.images.map((i) => i.url),
      description: v.description,
      features: v.features,
      openToTrade: v.openToTrade,
      country: v.country,
      state: v.state,
      city: v.city,
      postalCode: v.postalCode ?? "",
    };
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{edit ? "Edit your listing" : "Sell your vehicle"}</h1>
        <p className="mt-2 text-muted">
          {edit ? "Update details, photos, or price. Changes go live instantly." : "Five quick steps to reach thousands of enthusiasts. Your progress is saved automatically."}
        </p>
      </div>
      <SellWizard initial={initial} editId={edit} sellerName={user.name ?? "You"} />
    </div>
  );
}
