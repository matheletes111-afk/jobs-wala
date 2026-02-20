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
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-sm text-[#2563eb] hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
      <div className="container mx-auto px-4 pt-6">
        <div className="mb-6 flex items-center gap-4">
          <CompanyLogo
            companyLogo={profile.companyLogo}
            companyName={profile.companyName}
            size="lg"
            className="h-16 w-16 rounded-xl"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs at {profile.companyName}</h1>
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
