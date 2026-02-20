import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@/types";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import UserNavLinks from "@/components/user/UserNavLinks";

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
    <div className="flex min-h-screen flex-col bg-gray-50">
    <header className="sticky top-0 z-50 overflow-hidden border-b border-gray-200 bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/user/dashboard" className="flex shrink-0 items-center">
          <img
            src="/images/logo.jpeg"
            alt="Jobs Portal"
            width={64}
            height={64}
            style={{ minWidth: "16rem", minHeight: "7rem" }}
            className="h-12 w-12 shrink-0 rounded-lg object-contain sm:h-14 sm:w-14"
          />
        </Link>
        <nav className="flex items-center gap-3">
          <UserNavLinks />
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <LogoutButton />
            <span className="rounded bg-[#2563eb] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
              Candidate
            </span>
          </div>
        </nav>
      </div>
    </header>
    <main className="flex-1">{children}</main>
  </div>
  );
}

