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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sParams = await searchParams;
  const searchVal = typeof sParams.search === "string" ? sParams.search : "";
  const titleVal = typeof sParams.title === "string" ? sParams.title : "";
  const categoryVal = typeof sParams.category === "string" ? sParams.category : "";
  const locationVal = typeof sParams.location === "string" ? sParams.location : "";
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
    workMode: job.workMode,
    experienceRequired: job.experienceRequired,
    experienceMin: job.experienceMin,
    experienceMax: job.experienceMax,
    requiredSkills: job.requiredSkills ?? [],
    secondarySkills: job.secondarySkills ?? [],
    createdAt: job.createdAt,
    employer: {
      companyName: job.companyName || job.employer.companyName,
      companyLogo: job.employer.companyLogo,
      website: job.employer.website,
      description: job.employer.description,
    },
  };

  // Build back to jobs URL with search filters preserved
  const backParams = new URLSearchParams();
  if (searchVal) backParams.set("search", searchVal);
  if (titleVal) backParams.set("title", titleVal);
  if (categoryVal && categoryVal !== "all") backParams.set("category", categoryVal);
  if (locationVal) backParams.set("location", locationVal);
  if (typeof sParams.sort === "string" && sParams.sort !== "desc") backParams.set("sort", sParams.sort);
  const backQuery = backParams.toString();
  const backUrl = `/jobs/browse${backQuery ? `?${backQuery}` : ""}`;

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
    let matchScore: number | null = null;
    if (profile && profile.skills && profile.skills.length > 0) {
      const reqSkills = job.requiredSkills ?? [];
      if (reqSkills.length === 0) {
        matchScore = 100;
      } else {
        const matchedCount = reqSkills.filter((reqSkill) =>
          profile.skills.some(
            (candSkill) =>
              candSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
              reqSkill.toLowerCase().includes(candSkill.toLowerCase())
          )
        ).length;
        matchScore = Math.round((matchedCount / reqSkills.length) * 100);
      }
    }

    return (
      <div className="mx-auto max-w-7xl px-2 py-8 sm:px-4 text-slate-800">
        <Link href={backUrl} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-550 transition-all hover:text-slate-900 hover:-translate-x-1">
          <span className="text-lg">←</span> Back to jobs
        </Link>
        <JobDetails
          job={jobForDetails}
          search={searchVal}
          title={titleVal}
          category={categoryVal}
          location={locationVal}
          matchScore={matchScore}
          candidateSkills={profile?.skills ?? []}
        />
        {!hasApplied && profile && (
          <div className="mt-6">
            <ApplicationForm jobId={job.id} currentResumeUrl={profile.resumeUrl} currentResumeUpdatedAt={profile.resumeUpdatedAt} />
          </div>
        )}
        {hasApplied && (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-blue-700 font-semibold flex items-center gap-2 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              You have already applied for this job. Status:{" "}
              <span className="uppercase tracking-wider font-bold">{applications[0].status}</span>
            </p>
          </div>
        )}
        {!profile && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-amber-700 font-semibold mb-3 text-sm">
              Please complete your profile before applying to jobs.
            </p>
            <Link href="/user/profile/create">
              <Button variant="outline" className="border-amber-200 text-amber-750 bg-white hover:bg-amber-100/50">
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
    <div className="mx-auto max-w-7xl px-2 py-8 sm:px-4 text-slate-800">
      <Link href={backUrl} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-550 transition-all hover:text-slate-900 hover:-translate-x-1">
        <span className="text-lg">←</span> Back to jobs
      </Link>
      <JobDetails
        job={jobForDetails}
        search={searchVal}
        title={titleVal}
        category={categoryVal}
        location={locationVal}
      />
      <div className="mt-8 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold text-slate-850 mb-2">Join the community</h3>
        <p className="text-slate-500 text-sm mb-6">
          Login or register as a job seeker to apply for this job and track your applications.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link href={`/login?callbackUrl=${encodeURIComponent(`/jobs/${id}`)}`}>
            <Button className="w-full sm:w-32 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 rounded-xl">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" className="w-full sm:w-32 h-11 rounded-xl border-slate-200 hover:bg-slate-50 transition-all font-semibold">
              Register
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
