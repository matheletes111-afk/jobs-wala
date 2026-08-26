import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@prisma/client";
import JobSearch from "@/components/user/JobSearch";
import UserLayoutClient from "@/components/user/UserLayoutClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Job Search - JobDaddy",
  description: "Browse and apply for the latest job opportunities across our global network.",
};

export default async function JobsPage() {
  const user = await getCurrentUser();
  const isCandidate = user?.role === UserRole.JOB_SEEKER;

  const pageContent = (
    <div className="w-full max-w-7xl min-w-0 mx-auto px-4 py-8 sm:px-6 md:px-8 lg:px-10">
      {/* Command Center Header */}
      <div className="mb-10 border-b border-slate-200/60 pb-8 animate-in fade-in duration-700">
         <div className="flex items-center gap-2 mb-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-650">Available Opportunities</p>
         </div>
         <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
           Job Opportunities
         </h1>
         <p className="mt-2 text-sm font-semibold text-slate-500 max-w-2xl leading-relaxed">
           Discover your next career move. Browse and apply for the latest job opportunities across our global network.
         </p>
      </div>
      <Suspense fallback={
        <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 mb-4" />
          <p className="text-xs font-semibold text-slate-500">Loading Job Search...</p>
        </div>
      }>
        <JobSearch />
      </Suspense>
    </div>
  );

  if (isCandidate) {
    return (
      <UserLayoutClient userEmail={user.email ?? undefined}>
        {pageContent}
      </UserLayoutClient>
    );
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent selection:bg-blue-600/20 text-slate-800">
      <Header />
      <main className="flex-1 relative bg-transparent overflow-x-hidden">
        {/* Decorative background blobs */}
        <div className="absolute right-[5%] top-[12%] w-[550px] h-[550px] bg-blue-100/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute left-[-10%] top-[40%] w-[400px] h-[400px] bg-slate-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        {pageContent}
      </main>
      <Footer />
    </div>
  );
}

