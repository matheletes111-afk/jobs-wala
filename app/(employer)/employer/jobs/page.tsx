import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import EmployerJobListClient from "@/components/employer/EmployerJobListClient";
import { Plus, Briefcase } from "lucide-react";

export default async function EmployerJobsPage() {
  const user = await requireEmployer();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return (
      <div className="min-h-screen w-full min-w-0 bg-slate-50/50 text-foreground">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-16 sm:px-6 md:px-8 lg:px-10 lg:py-24">
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/20">
               <Briefcase className="h-10 w-10 text-amber-500 animate-pulse" />
            </div>
            <p className="mb-8 text-xl font-bold text-slate-700 italic">Profile Setup Required: Please complete your corporate profile to continue.</p>
            <Link href="/employer/profile">
              <Button className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold uppercase tracking-widest shadow-lg shadow-blue-500/10 transition-all hover:scale-105 active:scale-95">
                Set Up Company Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const jobsCount = await prisma.job.count({
    where: { postedBy: profile.userId },
  });

  if (jobsCount === 0) {
    return (
      <div className="min-h-screen w-full min-w-0 bg-slate-50/50 text-foreground">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 md:px-8 lg:px-10 lg:py-20">
          <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-3">Job Postings</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Your Jobs</h1>
              <p className="mt-2 text-slate-500 font-medium">Manage your active and past job postings.</p>
            </div>
            <Link href="/employer/jobs/new">
              <Button className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/10 transition-all hover:scale-105 active:scale-95 gap-2">
                <Plus className="h-4.5 w-4.5" />
                Post a New Job
              </Button>
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm animate-in fade-in zoom-in duration-1000">
             <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
                <Briefcase className="h-8 w-8 text-slate-400" />
             </div>
             <p className="mb-8 text-lg font-bold text-slate-700 italic">No active jobs recorded.</p>
             <Link href="/employer/jobs/new">
               <Button className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all hover:scale-105 active:scale-95">
                 Post First Job
               </Button>
             </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 bg-slate-50/50 text-foreground">
      <EmployerJobListClient />
    </div>
  );
}
