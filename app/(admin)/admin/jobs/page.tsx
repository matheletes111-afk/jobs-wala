import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import AdminJobsClient from "@/components/admin/AdminJobsClient";

export default async function AdminJobsPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <AdminJobsClient
      initialCategories={categories.map((c: any) => ({
        id: c.id,
        name: c.name,
      }))}
    />
  );
}
