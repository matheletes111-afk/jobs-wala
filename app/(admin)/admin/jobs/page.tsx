import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import AdminJobsClient from "@/components/admin/AdminJobsClient";

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const params = await searchParams;

  return (
    <AdminJobsClient
      searchParams={params}
      initialCategories={categories.map((c: any) => ({
        id: c.id,
        name: c.name,
      }))}
    />
  );
}
