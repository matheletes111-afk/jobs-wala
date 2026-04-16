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

const HERO_IMAGE_URL = "/images/home_img.png";

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
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-background selection:bg-primary/20">
      {/* Header - Premium Glassmorphism */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="mx-auto flex h-16 w-full max-w-7xl min-w-0 items-center justify-between gap-2 px-4 sm:px-6 md:px-8 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center transition-transform hover:scale-105 active:scale-95">
            {/* Mobile: smaller logo */}
            <div className="bg-white rounded-lg shadow-2xl flex items-center justify-center shrink-0 p-1 px-3 mt-1.5 transition-transform hover:scale-105 active:scale-95">
               <img
                 src="/images/logo.jpeg"
                 alt="Jobs Portal"
                 className="h-8 md:h-10 object-contain"
               />
            </div>
          </Link>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-foreground hover:bg-white/10">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-30 z-10" />

        {/* Hero / Banner - Premium Dark Style */}
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.08),transparent_50%),radial-gradient(circle_at_center,rgba(59,130,246,0.03),transparent_70%)] px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20 lg:px-10 xl:px-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:items-center">
            <div className="min-w-0 max-w-2xl flex-1 text-center lg:text-left">
              <p className="mb-4 inline-flex items-center rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-[#f97316] uppercase sm:text-sm">
                Ready to find your dream job?
              </p>
              <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
                Take the next step in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#f97316]">career journey.</span>
              </h1>
              <p className="mb-8 text-base text-muted-foreground sm:mb-10 sm:text-lg">
                Explore opportunities that match your skills and passions, and land the job you&apos;ve always wanted with JobsPortal.
              </p>
              <form action="/user/jobs" method="get" className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-stretch">
                <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl sm:flex-row sm:overflow-hidden transition-all focus-within:border-primary/50">
                  <span className="flex items-center border-b border-white/10 px-4 py-3 text-muted-foreground sm:border-b-0 sm:border-r">
                    <Search className="h-5 w-5 shrink-0" />
                  </span>
                  <input
                    type="search"
                    name="search"
                    placeholder="Enter skills or job title"
                    className="min-w-0 flex-1 bg-transparent py-3 px-4 text-sm text-foreground placeholder:text-white/30 outline-none sm:py-4"
                  />
                  <span className="hidden items-center border-l border-white/10 px-4 text-muted-foreground sm:flex">
                    <FileText className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    className="w-full border-t border-white/10 bg-transparent py-3 px-4 text-sm text-foreground placeholder:text-white/30 outline-none sm:w-32 sm:min-w-0 sm:border-t-0 sm:border-l sm:py-4"
                  />
                </div>
                <button
                  type="submit"
                  className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#f97316] px-8 py-4 text-white font-bold shadow-lg shadow-orange-500/20 transition-all hover:bg-[#ea580c] hover:scale-[1.02] active:scale-95 sm:px-10"
                >
                  <Search className="h-5 w-5" />
                  Search Jobs
                </button>
              </form>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8">
                <div className="animate-premium-hover">
                  <p className="text-2xl font-bold text-[#2563eb] sm:text-3xl">{activeJobsCount.toLocaleString()}+</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider sm:text-sm">Active Jobs</p>
                </div>
                {!user && (
                  <>
                    <Link
                      href="/employer/jobs/new"
                      className="flex items-center gap-2 text-sm font-semibold text-[#f97316] hover:underline hover:scale-105 transition-all"
                    >
                      <Briefcase className="h-4 w-4" />
                      Post Your Job
                    </Link>
                    <Link href="/user/jobs" className="text-sm font-semibold text-foreground/80 hover:text-foreground hover:underline hover:scale-105 transition-all">
                      Search Jobs
                    </Link>
                  </>
                )}
                {isCandidate && (
                  <Link href="/user/jobs" className="text-sm font-semibold text-[#f97316] hover:underline hover:scale-105 transition-all">
                    Search Jobs
                  </Link>
                )}
                {isEmployer && (
                  <Link
                    href="/employer/jobs/new"
                    className="flex items-center gap-2 text-sm font-semibold text-[#f97316] hover:underline hover:scale-105 transition-all"
                  >
                    <Briefcase className="h-4 w-4" />
                    Post Your Job
                  </Link>
                )}
              </div>
            </div>
            <div className="relative h-64 w-full min-w-0 max-w-xl shrink-0 sm:h-80 md:h-96 lg:h-[30rem] xl:h-[34rem] xl:max-w-2xl animate-in fade-in slide-in-from-right-10 duration-1000">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#2563eb]/10 to-transparent rounded-full blur-3xl" />
              <Image
                src={HERO_IMAGE_URL}
                alt="Find your dream job"
                fill
                className="object-contain object-right drop-shadow-2xl"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 512px, 576px"
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* CTA Banners - Premium Pill Style */}
        <section className="py-12 sm:py-16 bg-white/2">
          <div className="mx-auto flex max-w-7xl flex-col items-stretch justify-center gap-6 px-4 sm:flex-row sm:flex-wrap sm:px-6 md:px-8 lg:px-10">
            <Link
              href="/user/jobs"
              className="group relative flex min-w-0 items-center justify-between gap-4 overflow-hidden rounded-[2rem] bg-[#2563eb] px-8 py-8 text-white shadow-2xl transition-all hover:scale-[1.02] hover:shadow-blue-500/20 active:scale-95 sm:flex-1 md:max-w-[520px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative min-w-0 flex-1 text-left">
                <p className="truncate text-xl font-bold sm:text-2xl">Search your desired Job</p>
                <p className="mt-1 truncate text-sm font-medium text-blue-100/80 sm:text-base">
                  Discover a career you are passionate about
                </p>
              </div>
              <span className="relative flex shrink-0 transition-transform group-hover:rotate-12 group-hover:scale-110">
                <Search className="h-10 w-10 text-white sm:h-12 sm:w-12" strokeWidth={2.5} />
              </span>
            </Link>
            <Link
              href="/employer/jobs/new"
              className="group relative flex min-w-0 items-center justify-between gap-4 overflow-hidden rounded-[2rem] bg-[#f97316] px-8 py-8 text-white shadow-2xl transition-all hover:scale-[1.02] hover:shadow-orange-500/20 active:scale-95 sm:flex-1 md:max-w-[520px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative min-w-0 flex-1 text-left">
                <p className="truncate text-xl font-bold sm:text-2xl">Post a Job Today</p>
                <p className="mt-1 truncate text-sm font-medium text-orange-100/80 sm:text-base">
                  Discover the ideal candidate for your team
                </p>
              </div>
              <span className="relative flex shrink-0 transition-transform group-hover:rotate-12 group-hover:scale-110">
                <Send className="h-10 w-10 text-white sm:h-12 sm:w-12" strokeWidth={2.5} />
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
