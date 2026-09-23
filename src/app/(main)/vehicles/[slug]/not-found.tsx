import { CarFront } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function VehicleNotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState icon={CarFront} title="Unable to load this listing." description="It may have been sold or removed by the seller." action={<ButtonLink href="/marketplace">Browse similar vehicles</ButtonLink>} />
    </div>
  );
}
