import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || (user.role !== UserRole.EMPLOYER && user.role !== UserRole.ADMIN)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/employer/dashboard" className="text-xl font-bold">
            Job Portal - Employer
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/employer/dashboard">Dashboard</Link>
            <Link href="/employer/jobs">Jobs</Link>
            <Link href="/employer/applications">Applications</Link>
            <Link href="/employer/search">Search Candidates</Link>
            <Link href="/employer/profile">Profile</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

