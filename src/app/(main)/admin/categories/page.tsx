import { requireAdminPage } from "@/server/auth-guard";
import { adminListCategories } from "@/server/services/admin";
import { adminUpdateCategoryAction } from "@/server/actions/admin";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminTable, Td } from "@/components/admin/table";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/home/category-icon";

export default async function AdminCategories() {
  await requireAdminPage();
  const categories = await adminListCategories();
  return (
    <AdminTable head={["Category", "Slug", "Listings", "Order", "Status", "Actions"]}>
      {categories.map((c) => (
        <tr key={c.id}>
          <Td>
            <span className="flex items-center gap-2 font-medium">
              <CategoryIcon slug={c.slug} className="size-4 text-accent" /> {c.name}
            </span>
          </Td>
          <Td className="font-mono text-xs text-muted">{c.slug}</Td>
          <Td>{c._count.vehicles}</Td>
          <Td>{c.sortOrder}</Td>
          <Td>{c.isActive ? <Badge tone="success">Active</Badge> : <Badge>Hidden</Badge>}</Td>
          <Td>
            <div className="flex gap-2">
              <AdminButton variant="ghost" action={adminUpdateCategoryAction.bind(null, c.id, { sortOrder: Math.max(0, c.sortOrder - 1) })}>
                ↑
              </AdminButton>
              <AdminButton variant="ghost" action={adminUpdateCategoryAction.bind(null, c.id, { sortOrder: c.sortOrder + 1 })}>
                ↓
              </AdminButton>
              <AdminButton variant={c.isActive ? "danger" : "outline"} action={adminUpdateCategoryAction.bind(null, c.id, { isActive: !c.isActive })}>
                {c.isActive ? "Hide" : "Show"}
              </AdminButton>
            </div>
          </Td>
        </tr>
      ))}
    </AdminTable>
  );
}
