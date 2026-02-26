import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@/types";
import Link from "next/link";
import AdminHeaderNav from "@/components/admin/AdminHeaderNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-gray-50">
      <header className="sticky top-0 z-50 overflow-hidden border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl min-w-0 items-center justify-between gap-2 px-4 sm:px-6 md:px-8 lg:px-10">
          <Link href="/admin/dashboard" className="flex shrink-0 items-center">
            {/* Mobile: smaller logo */}
            <img
              src="/images/logo.jpeg"
              alt="Jobs Portal"
              width={64}
              height={64}
              className="h-10 w-auto max-w-[180px] shrink-0 rounded-lg object-contain sm:h-12 sm:max-w-[200px] md:hidden"
            />
            {/* Tablet/Desktop: original larger logo */}
            <img
              src="/images/logo.jpeg"
              alt="Jobs Portal"
              width={64}
              height={64}
              style={{ minWidth: "16rem", minHeight: "7rem" }}
              className="hidden shrink-0 rounded-lg object-contain md:block md:h-14 md:w-14"
            />
          </Link>
          <nav className="flex items-center">
            <AdminHeaderNav />
          </nav>
        </div>
      </header>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

