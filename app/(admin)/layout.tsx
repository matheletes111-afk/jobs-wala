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
          <Link href="/admin/dashboard" className="flex shrink-0 items-center gap-3 transition-transform hover:scale-105 active:scale-95">
            <div className="bg-white rounded-lg shadow-xl flex items-center justify-center shrink-0 p-1 px-2 transition-transform duration-200">
               <img
                 src="/images/logo.jpeg"
                 alt="Jobs Portal"
                 className="h-7 md:h-9 object-contain"
               />
            </div>
            <div className="hidden flex-col md:flex -space-y-1">
                <span className="text-base font-black tracking-tighter text-foreground">JOB<span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900">DADDY</span></span>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-500 opacity-80">Admin</span>
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

