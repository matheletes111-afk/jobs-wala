import { requireAdmin } from "@/lib/auth-utils";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  return <AdminUsersClient searchParams={params} />;
}
