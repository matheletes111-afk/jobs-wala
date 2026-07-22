import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import CategoryManager from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const containerClass =
    "mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10";

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      <div className={containerClass}>
        {/* Header Section */}
        <div className="mb-8 border-b border-slate-200/60 pb-6">
           <div className="flex items-center gap-2 mb-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Category Management</p>
           </div>
           <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
             Job <span className="text-blue-600">Categories</span>
           </h1>
           <p className="mt-1.5 text-sm font-medium text-slate-500">
             Create, edit, and manage job categories for the platform.
           </p>
        </div>

        <div className="mt-8">
          <CategoryManager
            initialCategories={categories.map((c: any) => ({
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
