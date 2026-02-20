import { requireAdmin } from "@/lib/auth-utils";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export default async function AdminUsersPage() {
  await requireAdmin();

  return <AdminUsersClient />;
}
