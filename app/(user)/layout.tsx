import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@/types";
import Link from "next/link";
import UserHeaderNav from "@/components/user/UserHeaderNav";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.JOB_SEEKER) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent text-foreground">
      <header className="sticky top-0 z-50 w-full glass border-b border-white/5 shadow-2xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl min-w-0 items-center justify-between gap-4 px-4 sm:px-6 md:px-8 lg:px-10">
          <Link href="/user/dashboard" className="flex shrink-0 items-center gap-3 transition-transform hover:scale-105 active:scale-95">
            <div className="bg-white rounded-lg shadow-2xl flex items-center justify-center shrink-0 p-1 px-3 mt-1.5 transition-transform duration-200">
              <img
                src="/images/logo.jpeg"
                alt="Jobs Portal"
                className="h-8 md:h-10 object-contain"
              />
            </div>
            <div className="hidden flex-col md:flex">
              <span className="text-lg font-black tracking-tighter text-foreground leading-none">JOB<span className="text-primary">DADDY</span></span>
            </div>
          </Link>
          <nav className="flex items-center">
            <UserHeaderNav />
          </nav>
        </div>
      </header>
      <main className="min-w-0 flex-1 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-30" />
        {children}
      </main>
    </div>
  );
}

