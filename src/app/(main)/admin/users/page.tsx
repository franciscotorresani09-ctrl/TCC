import Link from "next/link";
import { requireAdminPage } from "@/server/auth-guard";
import { adminListUsers } from "@/server/services/admin";
import { adminBanUserAction, adminSetRoleAction } from "@/server/actions/admin";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminTable, Td } from "@/components/admin/table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requireAdminPage();
  const q = (await searchParams).q?.slice(0, 80);
  const users = await adminListUsers(q);
  return (
    <div>
      <form className="mb-4 max-w-sm">
        <Input name="q" defaultValue={q} placeholder="Search by name, email, or username" aria-label="Search users" />
      </form>
      <AdminTable head={["User", "Email", "Type", "Listings", "Reports", "Joined", "Actions"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <Td>
              <Link href={u.username ? `/u/${u.username}` : "#"} className="flex items-center gap-2 hover:underline">
                <Avatar src={u.image} name={u.name} size="sm" />
                <span>
                  <span className="block font-medium">{u.name}</span>
                  <span className="text-xs text-subtle">@{u.username}</span>
                </span>
              </Link>
            </Td>
            <Td className="text-muted">{u.email}</Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                {u.role === "ADMIN" && <Badge tone="accent">Admin</Badge>}
                <Badge>{u.sellerType === "DEALER" ? "Dealer" : "Private"}</Badge>
                {u.isBanned && <Badge tone="danger">Suspended</Badge>}
              </div>
            </Td>
            <Td>{u._count.vehicles}</Td>
            <Td>{u._count.reportsAgainst}</Td>
            <Td className="text-muted">{formatDate(u.createdAt)}</Td>
            <Td>
              {u.id !== admin.id && (
                <div className="flex gap-2">
                  <AdminButton
                    variant={u.isBanned ? "outline" : "danger"}
                    action={adminBanUserAction.bind(null, u.id, !u.isBanned)}
                    confirm={u.isBanned ? undefined : { title: "Suspend this user?", description: "Their active listings will be paused and they'll be signed out everywhere." }}
                  >
                    {u.isBanned ? "Reinstate" : "Suspend"}
                  </AdminButton>
                  <AdminButton variant="ghost" action={adminSetRoleAction.bind(null, u.id, u.role === "ADMIN" ? "USER" : "ADMIN")}>
                    {u.role === "ADMIN" ? "Remove admin" : "Make admin"}
                  </AdminButton>
                </div>
              )}
            </Td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
