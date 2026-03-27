import AdminResumeDatabaseClient from "@/components/admin/AdminResumeDatabaseClient";
import { requireAdmin } from "@/lib/auth-utils";

export default async function AdminResumeDatabasePage() {
  await requireAdmin();

  return <AdminResumeDatabaseClient />;
}
