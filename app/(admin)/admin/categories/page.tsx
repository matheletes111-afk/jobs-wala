import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import CategoryManager from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const containerClass =
    "container mx-auto px-4 py-8 md:px-6 lg:px-8 lg:py-10";

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className={containerClass}>
        <div className="rounded-b-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 px-6 pb-8 pt-6 md:px-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Category CRUD
          </p>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Category Management
          </h1>
          <p className="text-gray-600">
            Create, edit, and manage job categories.
          </p>
        </div>
        <div className="mt-8">
        <CategoryManager
          initialCategories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          }))}
        />
        </div>
      </div>
    </div>
  );
}
