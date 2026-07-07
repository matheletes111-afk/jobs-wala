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
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent text-foreground animate-in fade-in duration-1000">
      <header className="sticky top-0 z-50 w-full glass border-b border-white/5 shadow-2xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl min-w-0 items-center justify-between gap-6 px-4 sm:px-6 md:px-8 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center">
            <div className="flex items-center justify-center shrink-0 h-10 md:h-12 overflow-hidden">
              <img
                src="/images/logo.png"
                alt="Jobs Portal"
                className="h-[140%] w-auto max-w-none object-contain"
              />
            </div>
          </Link>
          <nav className="flex items-center flex-1 justify-between">
            <AdminHeaderNav />
          </nav>
        </div>
      </header>
      <main className="min-w-0 flex-1 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-7xl bg-linear-to-r from-transparent via-blue-500/50 to-transparent opacity-30" />
        {children}
      </main>
    </div>
  );
}

