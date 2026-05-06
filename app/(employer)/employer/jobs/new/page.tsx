import { requireEmployer } from "@/lib/auth-utils";
import JobForm from "@/components/employer/JobForm";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function NewJobPage() {
  const user = await requireEmployer();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: true },
      },
    },
  });

  const activeSubscription = profile?.subscriptions[0];
  const isExpired = activeSubscription ? new Date(activeSubscription.endDate) < new Date() : true;
  
  let restrictionMessage = null;
  let isRestricted = false;

  if (!activeSubscription || isExpired) {
    isRestricted = true;
    restrictionMessage = "Please subscribe to an active plan to post new jobs.";
  } else {
    const jobCount = await prisma.job.count({
      where: {
        postedBy: user.id,
        createdAt: { gte: activeSubscription.startDate },
      },
    });

    if (activeSubscription.plan.jobLimit !== -1 && jobCount >= activeSubscription.plan.jobLimit) {
      isRestricted = true;
      restrictionMessage = `You have reached your limit of ${activeSubscription.plan.jobLimit} jobs for your current ${activeSubscription.plan.name} plan.`;
    }
  }

  return (
    <div className="min-h-screen w-full min-w-0 bg-black text-foreground">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-12">
        
        {isRestricted && (
          <div className="mb-12 linear-card rounded-[2rem] border-amber-500/20 bg-amber-500/5 p-8 flex items-center gap-4">
            <AlertCircle className="h-6 w-6 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-400 font-bold uppercase tracking-widest">{restrictionMessage}</p>
          </div>
        )}

        <div className="linear-card rounded-[2.5rem] bg-white/[0.02] p-8 sm:p-12 mb-12 border border-white/5">
          <div className="mb-8">
            <Link
              href="/employer/jobs"
              className="inline-flex items-center gap-3 h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/10 transition-all active:scale-95 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Job List
            </Link>
          </div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
            Employer Portal
          </p>
          <h1 className="mb-2 text-3xl font-black text-foreground lg:text-5xl tracking-tighter">
            Post a New <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">Job</span>
          </h1>
          <p className="text-muted-foreground font-semibold max-w-2xl">
            Provide the core details of your job opening to start attracting top talent across our platform.
          </p>
        </div>
        <div className="rounded-[3rem] p-1 shadow-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 overflow-hidden bg-card/40 backdrop-blur-sm">
          {!isRestricted ? (
            <JobForm />
          ) : (
            <div className="p-20 text-center text-muted-foreground italic font-medium">
              Job posting is currently disabled due to your subscription status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

