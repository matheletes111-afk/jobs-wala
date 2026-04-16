import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@/types";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import JobDetails from "@/components/user/JobDetails";
import ApplicationForm from "@/components/user/ApplicationForm";

export default async function PublicJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      employer: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!job || job.status !== "ACTIVE") {
    notFound();
  }

  // Build job for JobDetails (no applications)
  const jobForDetails = {
    id: job.id,
    title: job.title,
    description: job.description,
    location: job.location,
    category: job.category,
    salaryRange: job.salaryRange,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    payType: job.payType,
    employmentType: job.employmentType,
    experienceRequired: job.experienceRequired,
    experienceMin: job.experienceMin,
    experienceMax: job.experienceMax,
    requiredSkills: job.requiredSkills ?? [],
    secondarySkills: job.secondarySkills ?? [],
    createdAt: job.createdAt,
    employer: {
      companyName: job.employer.companyName,
      companyLogo: job.employer.companyLogo,
      website: job.employer.website,
      description: job.employer.description,
    },
  };

  // Logged-in job seeker: show apply section
  if (user?.role === UserRole.JOB_SEEKER) {
    const [applications, profile] = await Promise.all([
      prisma.application.findMany({
        where: { jobId: id, jobSeekerId: user.id },
      }),
      prisma.jobSeekerProfile.findUnique({
        where: { userId: user.id },
      }),
    ]);
    const hasApplied = applications.length > 0;


    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-all hover:text-foreground hover:-translate-x-1">
          <span className="text-lg">←</span> Back to home
        </Link>
        <JobDetails job={jobForDetails} />
        {!hasApplied && profile && (
          <div className="mt-8">
            <ApplicationForm jobId={job.id} currentResumeUrl={profile.resumeUrl} currentResumeUpdatedAt={profile.resumeUpdatedAt} />
          </div>
        )}
        {hasApplied && (
          <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-blue-400 font-semibold flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-400" />
              You have already applied for this job. Status:{" "}
              <span className="uppercase tracking-widest">{applications[0].status}</span>
            </p>
          </div>
        )}
        {!profile && (
          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-amber-400 font-semibold mb-4">
              Please complete your profile before applying to jobs.
            </p>
            <Link href="/user/profile/create">
              <Button variant="outline" className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10">
                Complete profile
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Not logged in or not a job seeker: show details + CTA to login/register to apply
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-all hover:text-foreground hover:-translate-x-1">
        <span className="text-lg">←</span> Back to home
      </Link>
      <JobDetails job={jobForDetails} />
      <div className="mt-12 linear-card rounded-[2rem] p-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-2xl font-bold text-foreground mb-3">Join the community</h3>
        <p className="text-muted-foreground mb-8">
          Login or register as a job seeker to apply for this job and track your applications.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
          <Link href={`/login?callbackUrl=${encodeURIComponent(`/jobs/${id}`)}`}>
            <Button className="w-full sm:w-32 btn-gradient h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" className="w-full sm:w-32 h-12 rounded-xl border-white/10 hover:bg-white/5 transition-all hover:scale-105 active:scale-95">
              Register
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
