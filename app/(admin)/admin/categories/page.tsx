import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import CategoryManager from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const containerClass =
    "mx-auto w-full max-w-7xl min-w-0 px-4 py-16 sm:px-6 md:px-8 lg:px-10 lg:py-20";

  return (
    <div className="min-h-screen w-full min-w-0 bg-background text-foreground animate-in fade-in duration-1000">
      <div className={containerClass}>
        {/* Header Section */}
        <div className="mb-16 border-b border-white/5 pb-10">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Category Management</p>
           </div>
           <h1 className="text-4xl font-black md:text-6xl tracking-tighter text-white">
             Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Categories</span>
           </h1>
           <p className="mt-4 text-lg font-medium text-muted-foreground/60 italic">
             Create, edit, and manage job categories for the platform.
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
