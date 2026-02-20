import { requireAdmin } from "@/lib/auth-utils";
import AdminJobsClient from "@/components/admin/AdminJobsClient";

export default async function AdminJobsPage() {
  await requireAdmin();

  return <AdminJobsClient />;
}
