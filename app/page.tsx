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
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-white">
      {/* Header - Jobs Portal style */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl min-w-0 items-center justify-between gap-2 px-4 sm:px-6 md:px-8 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center">
            {/* Mobile: smaller logo to avoid overflow */}
            <img
              src="/images/logo.jpeg"
              alt="Jobs Portal"
              width={64}
              height={64}
              className="h-10 w-auto max-w-[180px] shrink-0 rounded-lg object-contain sm:h-12 sm:max-w-[200px] md:hidden"
            />
            {/* Tablet/Desktop: original larger logo */}
            <img
              src="/images/logo.jpeg"
              alt="Jobs Portal"
              width={64}
              height={64}
              style={{ minWidth: "16rem", minHeight: "7rem" }}
              className="hidden shrink-0 rounded-lg object-contain md:block md:h-14 md:w-14"
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
        {/* Hero / Banner - equal left & right margin on all devices */}
        <section className="relative overflow-hidden bg-gradient-to-r from-sky-100/80 via-white to-white px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-10 xl:px-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 lg:flex-row lg:justify-between lg:items-center lg:gap-10">
            <div className="min-w-0 max-w-xl flex-1">
              <p className="mb-2 text-xs font-medium text-[#f97316] sm:text-sm">
                READY TO FIND YOUR DREAM JOB?
              </p>
              <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
                Take the next step in your career journey.
              </h1>
              <p className="mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base">
                Explore opportunities that match your skills and passions, and land the job you&apos;ve always wanted with JobsPortal.
              </p>
              <form action="/user/jobs" method="get" className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-stretch">
                <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm sm:flex-row sm:overflow-hidden">
                  <span className="flex items-center border-b border-gray-200 px-3 py-2.5 text-gray-400 sm:border-b-0 sm:border-l-0 sm:py-3">
                    <Search className="h-5 w-5 shrink-0" />
                  </span>
                  <input
                    type="search"
                    name="search"
                    placeholder="Enter skills or job title"
                    className="min-w-0 flex-1 py-2.5 px-3 text-sm outline-none sm:py-3 sm:px-2"
                  />
                  <span className="hidden items-center border-t border-gray-200 px-3 text-gray-400 sm:flex sm:border-t-0 sm:border-l">
                    <FileText className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    className="w-full border-t border-gray-200 py-2.5 px-3 text-sm outline-none sm:w-28 sm:min-w-0 sm:border-t-0 sm:border-l sm:py-3 sm:px-2"
                  />
                </div>
                <button
                  type="submit"
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 py-3 text-white hover:bg-[#ea580c] sm:px-6"
                >
                  <FileText className="h-5 w-5" />
                  Search
                </button>
              </form>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div>
                  <p className="text-xl font-bold text-[#2563eb] sm:text-2xl">{activeJobsCount.toLocaleString()}+</p>
                  <p className="text-xs text-gray-600 sm:text-sm">Active Jobs</p>
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
            <div className="relative h-56 w-full min-w-0 max-w-xl shrink-0 sm:h-64 md:h-72 lg:h-[28rem] xl:h-[32rem] xl:max-w-2xl">
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

        {/* CTA Banners - blue and orange (pill style) */}
        <section className="py-5 sm:py-6">
          <div className="mx-auto flex max-w-7xl flex-col items-stretch justify-center gap-4 px-4 sm:flex-row sm:flex-wrap sm:gap-6 sm:px-6 md:px-8 lg:px-10">
            <Link
              href="/user/jobs"
              className="flex min-w-0 items-center justify-between gap-4 rounded-full bg-[#2563eb] px-6 py-5 text-white shadow-lg transition hover:opacity-95 sm:flex-1 sm:min-w-0 sm:px-8 sm:py-6 md:max-w-[480px]"
            >
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-base font-bold sm:text-lg md:text-xl">Search your desired Job</p>
                <p className="mt-0.5 truncate text-sm font-normal text-blue-100 sm:text-base">
                  Discover a career you are passionate about
                </p>
              </div>
              <span className="flex shrink-0">
                <Search className="h-9 w-9 text-white sm:h-10 sm:w-10 md:h-12 md:w-12" strokeWidth={2} />
              </span>
            </Link>
            <Link
              href="/employer/jobs/new"
              className="flex min-w-0 items-center justify-between gap-4 rounded-full bg-[#f97316] px-6 py-5 text-white shadow-lg transition hover:opacity-95 sm:flex-1 sm:min-w-0 sm:px-8 sm:py-6 md:max-w-[480px]"
            >
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-base font-bold sm:text-lg md:text-xl">Post a Job Today</p>
                <p className="mt-0.5 truncate text-sm font-normal text-orange-100 sm:text-base">
                  Discover the ideal candidate for your team
                </p>
              </div>
              <span className="flex shrink-0">
                <Send className="h-9 w-9 text-white sm:h-10 sm:w-10 md:h-12 md:w-12" strokeWidth={2} />
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
