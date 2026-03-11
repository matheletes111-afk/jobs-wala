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
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          ← Back to home
        </Link>
        <JobDetails job={jobForDetails} />
        {!hasApplied && profile && (
          <div className="mt-8">
            <ApplicationForm jobId={job.id} currentResumeUrl={profile.resumeUrl} currentResumeUpdatedAt={profile.resumeUpdatedAt} />
          </div>
        )}
        {hasApplied && (
          <div className="mt-8 rounded-md bg-blue-50 p-4">
            <p className="text-blue-800">
              You have already applied for this job. Status:{" "}
              {applications[0].status}
            </p>
          </div>
        )}
        {!profile && (
          <div className="mt-8 rounded-md bg-yellow-50 p-4">
            <p className="text-yellow-800">
              Please complete your profile before applying to jobs.
            </p>
            <Link href="/user/profile/create">
              <Button variant="outline" className="mt-2">
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
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← Back to home
      </Link>
      <JobDetails job={jobForDetails} />
      <div className="mt-8 rounded-md border bg-gray-50 p-6 text-center">
        <p className="text-gray-700">
          Login or register as a job seeker to apply for this job.
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Link href={`/login?callbackUrl=${encodeURIComponent(`/jobs/${id}`)}`}>
            <Button>Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Register</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
