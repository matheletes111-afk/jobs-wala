import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import JobsFilterPageClient from "@/components/JobsFilterPageClient";
import CompanyLogo from "@/components/CompanyLogo";
import { getCurrentUser } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

export default async function JobsByCompanyPage({
  params,
}: {
  params: Promise<{ employerId: string }>;
}) {
  const { employerId } = await params;
  const user = await getCurrentUser();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: employerId },
    select: { companyName: true, companyLogo: true },
  });

  if (!profile) notFound();

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent selection:bg-primary/20">
      <Header />

      <main className="flex-1 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-30 z-10" />

        {/* Hero Section - Premium Style */}
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.08),transparent_50%),radial-gradient(circle_at_center,rgba(59,130,246,0.03),transparent_70%)] px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20 lg:px-10">
           <div className="mx-auto max-w-7xl">
              <Link
                href="/"
                className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#f97316] hover:underline hover:scale-105 transition-all"
              >
                ← Back to home
              </Link>
              
              <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center">
                <div className="flex-1 text-center lg:text-left">
                  <div className="mb-6 flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-start">
                     <CompanyLogo
                        companyLogo={profile.companyLogo}
                        companyName={profile.companyName}
                        size="lg"
                        className="h-24 w-24 rounded-2xl shadow-2xl border-4 border-white/5"
                      />
                      <div className="min-w-0">
                         <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
                            Jobs at <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#f97316]">{profile.companyName}</span>
                         </h1>
                         <p className="mt-4 text-base text-muted-foreground sm:text-lg max-w-2xl">
                            Explore available opportunities and build your career with {profile.companyName}. We are always looking for talented individuals to join our team.
                         </p>
                      </div>
                  </div>
                </div>
              </div>
           </div>
        </section>

        <div className="pb-20">
          <JobsFilterPageClient
            title="Open Positions"
            employerId={employerId}
          />
        </div>
      </main>
    </div>
  );
}
