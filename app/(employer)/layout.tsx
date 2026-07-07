import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@/types";
import Link from "next/link";
import EmployerHeaderNav from "@/components/employer/EmployerHeaderNav";
import { prisma } from "@/lib/prisma";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || (user.role !== UserRole.EMPLOYER && user.role !== UserRole.ADMIN)) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { employerProfile: true },
  });

  const isApproved = user.role === UserRole.ADMIN || dbUser?.employerProfile?.approvalStatus === "APPROVED";

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent text-foreground selection:bg-primary/30">
      <header className="sticky top-0 z-50 w-full glass border-b border-white/5 shadow-2xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl min-w-0 items-center justify-between gap-4 px-4 sm:px-6 md:px-8 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="flex items-center justify-center shrink-0 h-10 md:h-12 overflow-hidden">
              <img
                src="/images/logo.png"
                alt="Jobs Portal"
                className="h-[140%] w-auto max-w-none object-contain"
              />
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <EmployerHeaderNav isApproved={isApproved} />
          </nav>
        </div>
      </header>
      <main className="min-w-0 flex-1 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        {!isApproved && (
          <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 md:px-8 lg:px-10">
            <div className={`rounded-[1.5rem] border p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-700 ${dbUser?.employerProfile?.approvalStatus === "REJECTED"
                ? "border-red-500/20 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent"
                : "border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent"
              }`}>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center border ${dbUser?.employerProfile?.approvalStatus === "REJECTED"
                    ? "bg-red-500/20 border-red-500/20"
                    : "bg-amber-500/20 border-amber-500/20"
                  }`}>
                  <svg className={`h-6 w-6 animate-pulse ${dbUser?.employerProfile?.approvalStatus === "REJECTED" ? "text-red-500" : "text-amber-500"
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">
                    {dbUser?.employerProfile?.approvalStatus === "REJECTED" ? "Profile Rejected by Admin" : "Profile Completion Required"}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-white/60">
                    {dbUser?.employerProfile?.approvalStatus === "REJECTED"
                      ? `Reason: ${dbUser?.employerProfile?.rejectionReason || "No reason provided."}. Please correct the details below and submit again.`
                      : "Your profile is pending administrator approval. Please make sure all profile fields are completed."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

