import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import JobSearch from "@/components/user/JobSearch";

export default async function JobsPage() {
  await requireJobSeeker();

  // Fetch all active jobs for client-side filtering
  const allJobs = await prisma.job.findMany({
    where: {
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
    include: {
      employer: {
        include: {
          user: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Browse Jobs</h1>
      <JobSearch initialJobs={allJobs} />
    </div>
  );
}

