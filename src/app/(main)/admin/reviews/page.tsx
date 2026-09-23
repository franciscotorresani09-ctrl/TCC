import { requireAdminPage } from "@/server/auth-guard";
import { adminListReviews } from "@/server/services/admin";
import { adminSetReviewHiddenAction } from "@/server/actions/admin";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminTable, Td } from "@/components/admin/table";
import { RatingStars } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function AdminReviews() {
  await requireAdminPage();
  const reviews = await adminListReviews();
  return (
    <AdminTable head={["Review", "Rating", "Author → Member", "Date", "Reports", "Actions"]}>
      {reviews.map((r) => (
        <tr key={r.id} className={r.isHidden ? "opacity-60" : ""}>
          <Td className="max-w-sm">
            <p className="line-clamp-2 text-muted">{r.comment}</p>
            {r.isHidden && <Badge tone="danger" className="mt-1">Hidden</Badge>}
          </Td>
          <Td>
            <RatingStars value={r.rating} />
          </Td>
          <Td className="text-muted">
            {r.author.name} → {r.targetUser.name}
          </Td>
          <Td className="text-muted">{formatDate(r.createdAt)}</Td>
          <Td>{r._count.reports}</Td>
          <Td>
            <AdminButton variant={r.isHidden ? "outline" : "danger"} action={adminSetReviewHiddenAction.bind(null, r.id, !r.isHidden)}>
              {r.isHidden ? "Restore" : "Hide"}
            </AdminButton>
          </Td>
        </tr>
      ))}
    </AdminTable>
  );
}
