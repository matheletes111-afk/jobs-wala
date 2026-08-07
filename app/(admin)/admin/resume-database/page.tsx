import AdminResumeDatabaseClient from "@/components/admin/AdminResumeDatabaseClient";
import { requireAdmin } from "@/lib/auth-utils";

export default async function AdminResumeDatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  return <AdminResumeDatabaseClient searchParams={params} />;
}
