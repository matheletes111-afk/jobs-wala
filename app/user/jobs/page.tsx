import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@prisma/client";
import JobSearch from "@/components/user/JobSearch";
import { ChevronDown } from "lucide-react";

export const metadata = {
  title: "Job Search - JobDaddy",
  description: "Browse and apply for the latest job opportunities across our global network.",
};

export default async function JobsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent selection:bg-primary/20">
      <Header />

      {/* Main Content */}
      <main className="flex-1 relative bg-transparent overflow-x-hidden">
        {/* Decorative background blobs */}
        <div className="absolute right-[5%] top-[12%] w-[550px] h-[550px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute left-[-10%] top-[40%] w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 md:px-8 lg:px-10 lg:py-24">
          {/* Command Center Header */}
          <div className="mb-16 border-b border-slate-100 pb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
             <div className="flex items-center gap-3 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Available Opportunities</p>
             </div>
             <h1 className="text-4xl font-black text-slate-900 md:text-6xl tracking-tighter leading-tight">
               Job <span className="text-primary">Portal</span>
             </h1>
             <p className="mt-4 text-base font-medium text-slate-500 max-w-2xl">
               Discover your next career move. Browse and apply for the latest job opportunities across our global network.
             </p>
          </div>
          <JobSearch />
        </div>
      </main>
    </div>
  );
}
