import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@prisma/client";
import { CategoryStatus } from "@prisma/client";
import HomePageClient from "@/components/HomePageClient";
import { formatLocation } from "@/lib/utils";
import { Briefcase, FileText, Search, Send, ChevronDown } from "lucide-react";

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
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent selection:bg-primary/20">
      {/* Header - Premium Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/60 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl min-w-0 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center transition-transform hover:scale-105 active:scale-95">
            <div className="bg-white rounded-lg shadow-md flex items-center justify-center shrink-0 p-1 px-3 mt-1.5 transition-transform hover:scale-105 active:scale-95">
              <img
                src="/images/logo.jpeg"
                alt="Jobs Portal"
                className="h-8 md:h-10 object-contain"
              />
            </div>
          </Link>

          {/* Right Aligned Container */}
          <div className="flex items-center gap-8">
            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="#about" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors flex items-center gap-1">
                About <ChevronDown className="h-3 w-3 text-slate-400" />
              </Link>
              
              {/* Services Dropdown */}
              <div className="relative group py-4">
                <span className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
                  Services <ChevronDown className="h-3 w-3 text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
                </span>
                
                <div className="absolute right-0 top-full hidden group-hover:block w-[360px] bg-white border border-slate-100 rounded-2xl shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="space-y-4 text-left">
                    {/* Category 1: Talent Solutions */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Talent Solutions</p>
                      <div className="grid gap-0.5">
                        <Link href="#contingent" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                          Contingent Workforce Solution
                        </Link>
                        <Link href="#ats" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                          AI Powered ATS
                        </Link>
                        <Link href="#contact" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                          Recruitment Solution <span className="text-[10px] text-slate-400 font-normal">(Contact Us)</span>
                        </Link>
                        <Link href="#hire-talent" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                          Hire a Talent
                        </Link>
                        <Link href="/employer/jobs/new" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                          Post a Job
                        </Link>
                      </div>
                    </div>

                    {/* Category 2: Career Services */}
                    <div className="space-y-1 pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Career Services</p>
                      <div className="grid gap-0.5">
                        <Link href="#super-resume" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                          Get your super resume
                        </Link>
                        <Link href="#linkedin-optimization" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                          LinkedIn Optimization
                        </Link>
                        <Link href="#career-counselling" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                          Career Counselling
                        </Link>
                        <Link href="#interview-preparation" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                          Interview Preparation
                        </Link>
                      </div>
                    </div>

                    {/* Category 3: IT & Digital Solutions */}
                    <div className="space-y-1 pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">IT & Digital Solutions</p>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[14px] font-medium text-slate-800">IT Product Development</p>
                        <p className="text-xs text-slate-500 font-normal leading-relaxed mt-1">
                          Mobile App Development, Website Development, Built your own CRM, POS system, Heavy Portal, SEO, SEM, Digital Marketing, Chat Bot, Workflow Automation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="#products" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors flex items-center gap-1">
                Products <ChevronDown className="h-3 w-3 text-slate-400" />
              </Link>
              <Link href="/user/jobs" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                Careers
              </Link>
              <Link href="#contact" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                Contact us
              </Link>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Link href="#book-demo" className="hidden sm:inline-block">
                <Button variant="outline" className="h-10 px-5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95">
                  Book Demo
                </Button>
              </Link>
              
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-5">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="#free-trial" className="hidden xs:inline-block">
                    <Button className="bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-5">
                      Free trial
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-4">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register" className="hidden sm:inline-block">
                    <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-5">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
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
              <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
                Take the next step <br />
                in your <span className="text-[#3b82f6]">career</span> <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] to-[#ec4899]">journey.</span>
              </h1>
              <p className="mb-8 text-sm text-muted-foreground sm:mb-10 sm:text-base">
                Explore opportunities that match your skills and passions, and land the job you&apos;ve always wanted with JobsPortal.
              </p>
              <form action="/user/jobs" method="get" className="mb-8 flex flex-col gap-4 sm:mb-10 items-center lg:items-start">
                <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-black/10 bg-white shadow-xl sm:flex-row sm:overflow-hidden transition-all focus-within:border-primary/50">
                  <span className="flex items-center border-b border-black/10 px-4 py-3 text-muted-foreground sm:border-b-0 sm:border-r sm:py-4">
                    <Search className="h-5 w-5 shrink-0" />
                  </span>
                  <input
                    type="search"
                    name="search"
                    placeholder="Enter skills or job title"
                    className="min-w-0 flex-1 bg-transparent py-3 px-4 text-sm text-foreground placeholder:text-slate-400 outline-none sm:py-4"
                  />
                  <span className="hidden items-center border-l border-black/10 px-4 text-muted-foreground sm:flex">
                    <FileText className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    className="w-full border-t border-black/10 bg-transparent py-3 px-4 text-sm text-foreground placeholder:text-slate-400 outline-none sm:w-48 sm:min-w-0 sm:border-t-0 sm:border-l sm:py-4"
                  />
                </div>
                <button
                  style={{ "color": "white" }}
                  type="submit"
                  className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#f97316] px-12 py-4 text-white font-bold shadow-lg shadow-orange-500/20 transition-all hover:bg-[#ea580c] hover:scale-[1.02] active:scale-95"
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
            <div className="relative h-64 w-full min-w-0 max-w-xl shrink-0 sm:h-[25rem] md:h-[28rem] lg:h-[34rem] xl:h-[40rem] lg:max-w-[44rem] xl:max-w-[50rem] lg:-my-6 xl:-my-8 animate-in fade-in slide-in-from-right-10 duration-1000">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#2563eb]/10 to-transparent rounded-full blur-3xl" />
              <Image
                src={HERO_IMAGE_URL}
                alt="Find your dream job"
                fill
                className="object-contain object-center lg:object-right drop-shadow-2xl scale-[1.02]"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 700px, 800px"
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* CTA Banners - Premium Pill Style */}
        <section className="py-12 sm:py-16 bg-transparent">
          <div className="mx-auto flex max-w-7xl flex-col items-stretch justify-center gap-6 px-4 sm:flex-row sm:flex-wrap sm:px-6 md:px-8 lg:px-10">
            <Link
              href="/user/jobs"
              className="group relative flex min-w-0 items-center justify-between gap-4 overflow-hidden rounded-[2rem] bg-[#2563eb] px-8 py-8 text-white shadow-2xl transition-all hover:scale-[1.02] hover:shadow-blue-500/20 active:scale-95 sm:flex-1 md:max-w-[520px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative min-w-0 flex-1 text-left">
                <p className="truncate text-xl font-bold sm:text-2xl" style={{ "color": "white" }}>Search your desired Job</p>
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
                <p className="truncate text-xl font-bold sm:text-2xl" style={{ "color": "white" }}>Post a Job Today</p>
                <p className="mt-1 truncate text-sm font-medium text-orange-100/80 sm:text-base">
                  Discover the ideal candidate for your team
                </p>
              </div>
              <span className="relative flex shrink-0 transition-transform group-hover:rotate-12 group-hover:scale-110" style={{ "color": "white" }}>
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
