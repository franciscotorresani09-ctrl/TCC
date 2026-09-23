import Link from "next/link";
import { requireAdminPage } from "@/server/auth-guard";
import { adminListEvents } from "@/server/services/admin";
import { adminUpdateEventAction } from "@/server/actions/admin";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminTable, Td } from "@/components/admin/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { EVENT_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function AdminEvents() {
  await requireAdminPage();
  const events = await adminListEvents();
  return (
    <AdminTable head={["Event", "Type", "Date", "Organizer", "Attendees", "Status", "Actions"]}>
      {events.map((e) => (
        <tr key={e.id}>
          <Td>
            <Link href={`/events/${e.slug}`} className="font-medium hover:underline">
              {e.title}
            </Link>
            <span className="block text-xs text-subtle">
              {e.city}, {e.state} {e.visibility === "PRIVATE" && "· Private"}
            </span>
          </Td>
          <Td>
            <Badge>{EVENT_TYPES.labels[e.type]}</Badge>
          </Td>
          <Td className="text-muted">{formatDate(e.startsAt)}</Td>
          <Td className="text-muted">{e.organizer.name}</Td>
          <Td>{e._count.attendees}</Td>
          <Td>
            <StatusBadge status={e.status} />
          </Td>
          <Td>
            <div className="flex gap-2">
              <AdminButton variant="ghost" action={adminUpdateEventAction.bind(null, e.id, { isFeatured: !e.isFeatured })}>
                {e.isFeatured ? "Unfeature" : "Feature"}
              </AdminButton>
              {e.status === "ACTIVE" ? (
                <AdminButton variant="danger" action={adminUpdateEventAction.bind(null, e.id, { status: "CANCELLED" })} confirm={{ title: "Cancel this event?", description: "Attendees will see it as cancelled." }}>
                  Cancel
                </AdminButton>
              ) : (
                <AdminButton action={adminUpdateEventAction.bind(null, e.id, { status: "ACTIVE" })}>Restore</AdminButton>
              )}
            </div>
          </Td>
        </tr>
      ))}
    </AdminTable>
  );
}
