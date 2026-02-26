import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import JobsFilterPageClient from "@/components/JobsFilterPageClient";
import CompanyLogo from "@/components/CompanyLogo";

export default async function JobsByCompanyPage({
  params,
}: {
  params: Promise<{ employerId: string }>;
}) {
  const { employerId } = await params;

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: employerId },
    select: { companyName: true, companyLogo: true },
  });

  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:px-8 lg:px-10">
          <Link
            href="/"
            className="text-sm text-[#2563eb] hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 md:px-8 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <CompanyLogo
            companyLogo={profile.companyLogo}
            companyName={profile.companyName}
            size="lg"
            className="h-16 w-16 rounded-xl"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Jobs at {profile.companyName}</h1>
          </div>
        </div>
      </div>
      <JobsFilterPageClient
        title="Open Positions"
        employerId={employerId}
      />
    </div>
  );
}
