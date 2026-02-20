import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import EmployerApplicationListClient from "@/components/employer/EmployerApplicationListClient";

export default async function EmployerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireEmployer();
  const params = await searchParams;

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

  const jobId = params.jobId as string | undefined;
  const statusRaw = params.status;
  const initialStatus =
    typeof statusRaw === "string"
      ? statusRaw
      : Array.isArray(statusRaw)
        ? statusRaw[0]
        : undefined;

  const jobs = await prisma.job.findMany({
    where: { postedBy: profile.userId },
    select: { id: true, title: true },
  });

  return (
    <EmployerApplicationListClient
      jobs={jobs}
      initialJobId={jobId}
      initialStatus={initialStatus}
    />
  );
}

