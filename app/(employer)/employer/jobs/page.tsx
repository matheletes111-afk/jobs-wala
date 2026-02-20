import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import EmployerJobListClient from "@/components/employer/EmployerJobListClient";
import { Plus } from "lucide-react";

export default async function EmployerJobsPage() {
  const user = await requireEmployer();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8 lg:py-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-gray-600">Please complete your profile first.</p>
            <Link href="/employer/profile">
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">Complete Profile</Button>
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
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8 lg:py-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">My Jobs</h1>
              <p className="mt-1 text-gray-600">Manage your job postings</p>
            </div>
            <Link href="/employer/jobs/new">
              <Button className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8]">
                <Plus className="h-4 w-4" />
                Post New Job
              </Button>
            </Link>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-gray-500">You haven&apos;t posted any jobs yet.</p>
            <Link href="/employer/jobs/new">
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">Post Your First Job</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <EmployerJobListClient />
    </div>
  );
}
