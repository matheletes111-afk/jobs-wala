import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@prisma/client";
import { CategoryStatus } from "@prisma/client";
import HomePageClient from "@/components/HomePageClient";
import { formatLocation } from "@/lib/utils";
import { Briefcase, FileText, Search, Send } from "lucide-react";

const HERO_IMAGE_URL = "https://sharjeelanjum.com/html/jobs-portal/images/hero-image.png";

export default async function HomePage() {
  const user = await getCurrentUser();

  // Top companies: employers with ACTIVE jobs (ordered by job count) + location + open jobs count
  const jobCounts = await prisma.job.groupBy({
    by: ["postedBy"],
    where: { status: "ACTIVE" },
    _count: { postedBy: true },
    orderBy: { _count: { postedBy: "desc" } },
    take: 12,
  });
  const userIds = jobCounts.map((j) => j.postedBy);
  const [employerProfiles, jobsForLocation] = await Promise.all([
    prisma.employerProfile.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, companyName: true, companyLogo: true },
    }),
    prisma.job.findMany({
      where: { postedBy: { in: userIds }, status: "ACTIVE" },
      select: { postedBy: true, location: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const locationByEmployer: Record<string, string> = {};
  for (const j of jobsForLocation) {
    if (locationByEmployer[j.postedBy] == null)
      locationByEmployer[j.postedBy] = formatLocation(j.location);
  }
  const countByEmployer = Object.fromEntries(
    jobCounts.map((j) => [j.postedBy, j._count.postedBy])
  );
  const topCompanies = userIds
    .map((uid) => {
      const profile = employerProfiles.find((e) => e.userId === uid);
      if (!profile) return null;
      return {
        userId: profile.userId,
        companyName: profile.companyName,
        companyLogo: profile.companyLogo ?? null,
        location: locationByEmployer[uid] ?? "Not specified",
        openJobsCount: countByEmployer[uid] ?? 0,
      };
    })
    .filter(Boolean) as {
      userId: string;
      companyName: string;
      companyLogo: string | null;
      location: string;
      openJobsCount: number;
    }[];

  // Active categories with job count
  const categoryJobCounts = await prisma.job.groupBy({
    by: ["category"],
    where: { status: "ACTIVE" },
    _count: { category: true },
  });
  const countByCategory = Object.fromEntries(
    categoryJobCounts.map((c) => [c.category, c._count.category])
  );
  const categoriesRaw = await prisma.category.findMany({
    where: { status: CategoryStatus.ACTIVE },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const categories = categoriesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    jobCount: countByCategory[c.name] ?? 0,
  }));

  const isEmployer = user?.role === UserRole.EMPLOYER;
  const isCandidate = user?.role === UserRole.JOB_SEEKER;

  const activeJobsCount = await prisma.job.count({
    where: { status: "ACTIVE" },
  });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header - Jobs Portal style */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Link href="/" className="flex shrink-0 items-center">
            <img
              src="/images/logo.jpeg"
              alt="Jobs Portal"
              width={64}
              height={64}
              style={{ minWidth: "16rem", minHeight: "7rem" }}  
              className="h-12 w-12 shrink-0 rounded-lg object-contain sm:h-14 sm:w-14"
            />
          </Link>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb]/5">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero - gradient left, search bar, image right */}
        <section className="relative overflow-hidden bg-gradient-to-r from-sky-100/80 via-white to-white px-4 py-10 sm:py-12">
          <div className="container mx-auto flex flex-col items-center gap-8 lg:flex-row lg:justify-between lg:items-center lg:gap-10">
            <div className="max-w-xl flex-1">
              <p className="mb-2 text-sm font-medium text-[#f97316]">
                READY TO FIND YOUR DREAM JOB?
              </p>
              <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Take the next step in your career journey.
              </h1>
              <p className="mb-6 text-gray-600">
                Explore opportunities that match your skills and passions, and land the job you&apos;ve always wanted with JobsPortal.
              </p>
              <form action="/user/jobs" method="get" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <span className="flex items-center px-3 text-gray-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input
                    type="search"
                    name="search"
                    placeholder="Enter skills or job title"
                    className="min-w-0 flex-1 py-3 px-2 text-sm outline-none"
                  />
                  <span className="flex items-center border-l border-gray-200 px-3 text-gray-400">
                    <FileText className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    name="category"
                    placeholder="Select Category"
                    className="w-32 py-3 px-2 text-sm outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-6 py-3 text-white hover:bg-[#ea580c]"
                >
                  <FileText className="h-5 w-5" />
                  Search
                </button>
              </form>
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-2xl font-bold text-[#2563eb]">{activeJobsCount.toLocaleString()}+</p>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                </div>
                {!user && (
                  <>
                    <Link
                      href="/employer/jobs/new"
                      className="flex items-center gap-2 text-sm font-medium text-[#f97316] hover:underline"
                    >
                      <Briefcase className="h-4 w-4" />
                      Post Your Job
                    </Link>
                    <Link href="/user/jobs" className="text-sm font-medium text-gray-700 hover:underline">
                      Search Jobs
                    </Link>
                  </>
                )}
                {isCandidate && (
                  <Link href="/user/jobs" className="text-sm font-medium text-[#f97316] hover:underline">
                    Search Jobs
                  </Link>
                )}
                {isEmployer && (
                  <Link
                    href="/employer/jobs/new"
                    className="flex items-center gap-2 text-sm font-medium text-[#f97316] hover:underline"
                  >
                    <Briefcase className="h-4 w-4" />
                    Post Your Job
                  </Link>
                )}
              </div>
            </div>
            <div className="relative h-80 w-full max-w-xl shrink-0 sm:h-[28rem] lg:h-[32rem] lg:max-w-2xl">
              <Image
                src={HERO_IMAGE_URL}
                alt="Find your dream job"
                fill
                className="object-contain object-right"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 512px, 576px"
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* CTA Banners - blue and green (pill style, same as reference) */}
        <section className="container mx-auto px-4 py-5 sm:py-6">
          <div className="flex flex-wrap items-stretch justify-center gap-6">
            <Link
              href="/user/jobs"
              className="flex w-full items-center justify-between gap-6 rounded-full bg-[#2563eb] px-8 py-6 text-white shadow-lg transition hover:opacity-95 sm:w-auto sm:min-w-[480px]"
            >
              <div className="min-w-0 flex-1 text-left">
                <p className="whitespace-nowrap text-lg font-bold sm:text-xl">Search your desired Job</p>
                <p className="mt-1 whitespace-nowrap text-sm font-normal text-blue-100 sm:text-base">
                  Discover a career you are passionate about
                </p>
              </div>
              <span className="flex shrink-0">
                <Search className="h-10 w-10 text-white sm:h-12 sm:w-12" strokeWidth={2} />
              </span>
            </Link>
            <Link
              href="/employer/jobs/new"
              className="flex w-full items-center justify-between gap-6 rounded-full bg-[#f97316] px-8 py-6 text-white shadow-lg transition hover:opacity-95 sm:w-auto sm:min-w-[480px]"
            >
              <div className="min-w-0 flex-1 text-left">
                <p className="text-lg font-bold sm:text-xl">Post a Job Today</p>
                <p className="mt-1 text-sm font-normal text-orange-100 sm:text-base">
                  Discover the ideal candidate for your team
                </p>
              </div>
              <span className="flex shrink-0">
                <Send className="h-10 w-10 text-white sm:h-12 sm:w-12" strokeWidth={2} />
              </span>
            </Link>
          </div>
        </section>

        {/* Top Companies, Categories, Latest Jobs (client for filtering) */}
        <HomePageClient topCompanies={topCompanies} categories={categories} />
      </main>
    </div>
  );
}
