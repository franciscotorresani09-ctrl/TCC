import { CalendarX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function EventNotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState icon={CalendarX} title="Unable to load this event." description="It may be private, cancelled, or no longer available." action={<ButtonLink href="/events">See upcoming events</ButtonLink>} />
    </div>
  );
}
