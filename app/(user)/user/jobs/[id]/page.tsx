import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import JobDetails from "@/components/user/JobDetails";
import ApplicationForm from "@/components/user/ApplicationForm";

export default async function JobDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireJobSeeker();

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      employer: {
        include: {
          user: true,
        },
      },
      applications: {
        where: { jobSeekerId: user.id },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const hasApplied = job.applications.length > 0;
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <JobDetails job={job} />
      {!hasApplied && profile && (
        <div className="mt-8">
          <ApplicationForm jobId={job.id} />
        </div>
      )}
      {hasApplied && (
        <div className="mt-8 rounded-md bg-blue-50 p-4">
          <p className="text-blue-800">
            You have already applied for this job. Status:{" "}
            {job.applications[0].status}
          </p>
        </div>
      )}
      {!profile && (
        <div className="mt-8 rounded-md bg-yellow-50 p-4">
          <p className="text-yellow-800">
            Please complete your profile before applying to jobs.
          </p>
        </div>
      )}
    </div>
  );
}

