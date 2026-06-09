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

      <main className="flex-1 relative bg-transparent">
        {/* Hero / Banner - Premium Clean Figma Style */}
        <section className="relative overflow-hidden bg-transparent px-4 pt-12 pb-0 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          {/* Decorative blue blobs behind the boy */}
          <div className="absolute right-[10%] top-[10%] w-[450px] h-[450px] bg-blue-200/35 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-[5%] bottom-[5%] w-[300px] h-[300px] bg-sky-200/25 rounded-full blur-3xl pointer-events-none" />

          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 lg:flex-row lg:justify-between lg:items-end">

            {/* Left Column: Title, Description, and Search */}
            <div className="min-w-0 max-w-2xl flex-1 text-center lg:text-left pb-16 lg:pb-24">
              <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-tight">
                Find Jobs. <br />
                Get Matched. <br />
                <span className="text-[#2563eb]">Grow Your Career.</span>
              </h1>
              <p className="mb-10 text-sm md:text-base text-slate-500 max-w-xl leading-relaxed mx-auto lg:mx-0 font-medium text-left">
                Our AI technology matches your skills with the right opportunities, so you can focus on what matters – building your future.
              </p>
              {/* Search Section - High Fidelity replica of Figma */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_15px_50px_rgba(0,0,0,0.03)] p-6 md:p-8 w-full max-w-3xl mx-auto lg:mx-0 mb-8 relative z-20">
                <form action="/user/jobs" method="get" className="flex flex-col md:flex-row items-end gap-5 mb-6">

                  {/* Input block 1: Job title, skills or company */}
                  <div className="flex-1 flex flex-col gap-2 w-full text-left">
                    <label className="text-sm font-bold text-slate-800">Job title, skills or company</label>
                    <input
                      type="search"
                      name="search"
                      placeholder="e.g. Software Engineer"
                      className="search-input w-full text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      style={{ height: "48px", padding: "0 16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  {/* Input block 2: Location */}
                  <div className="flex-1 flex flex-col gap-2 w-full text-left">
                    <label className="text-sm font-bold text-slate-800">Location</label>
                    <input
                      type="text"
                      name="location"
                      placeholder="e.g. Bangalore"
                      className="search-input w-full text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      style={{ height: "48px", padding: "0 16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  {/* Search Button */}
                  <button
                    type="submit"
                    className="h-12 w-full md:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                    style={{ color: "white", background: "#2563eb", border: "none", borderRadius: "12px" }}
                  >
                    <Search className="h-4 w-4" style={{ stroke: "white" }} />
                    <span style={{ color: "white", }}>Search Jobs</span>
                  </button>
                </form>

                {/* Popular Searches */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 text-left">
                  <span className="font-bold text-slate-700 mr-2">Popular Searches:</span>
                  {["Software Developer", "Sales", "Marketing", "Data Analyst", "Customer Support"].map((tag) => (
                    <Link
                      key={tag}
                      href={`/user/jobs?search=${encodeURIComponent(tag)}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-50/60 hover:bg-blue-100/80 text-[#2563eb] font-semibold transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Hero Boy Image with Floating Badges (shifted slightly left and moved UP to align with Find Jobs text) */}
            <div className="relative z-30 w-full max-w-lg lg:max-w-xl shrink-0 h-[360px] sm:h-[420px] md:h-[480px] lg:h-[540px] xl:h-[600px] flex items-end justify-center -translate-y-8 sm:-translate-y-12 lg:-translate-y-20 xl:-translate-y-24 lg:-translate-x-12 xl:-translate-x-20 transition-all">

              {/* Bubble Background behind the boy */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none -translate-y-8">
                {/* Large Main Bubble */}
                <div className="absolute w-[95%] aspect-square rounded-full bg-gradient-to-tr from-[#bae6fd] via-[#e0f2fe]/90 to-[#f0f9ff]/50 border-[3px] border-white/70 shadow-[inset_-12px_-12px_35px_rgba(255,255,255,0.7),_0_25px_60px_rgba(14,165,233,0.15)] backdrop-blur-[2px]" />
                
                {/* Secondary Bubble 1 (Top Left) */}
                <div className="absolute top-[2%] left-[-8%] w-[32%] aspect-square rounded-full bg-gradient-to-tr from-[#e0f2fe] to-white/40 border-2 border-white/80 shadow-[inset_-4px_-4px_12px_rgba(255,255,255,0.8),_0_12px_24px_rgba(14,165,233,0.1)]" />
                
                {/* Secondary Bubble 2 (Bottom Right) */}
                <div className="absolute bottom-[5%] right-[-8%] w-[35%] aspect-square rounded-full bg-gradient-to-tr from-[#bae6fd]/90 to-white/30 border-2 border-white/70 shadow-[inset_-6px_-6px_18px_rgba(255,255,255,0.7),_0_20px_40px_rgba(14,165,233,0.12)]" />

                {/* Smaller Accent Bubbles */}
                <div className="absolute top-[38%] right-[-12%] w-[12%] aspect-square rounded-full bg-[#bfdbfe]/70 border border-white/50 shadow-inner" />
                <div className="absolute top-[15%] left-[38%] w-[8%] aspect-square rounded-full bg-white/50 border border-white/60" />
              </div>

              {/* Boy Image aligned perfectly to the bottom and zoomed in even more (130% size) */}
              <div className="absolute bottom-0 w-[130%] h-[130%] z-10 translate-y-[12%]">
                <Image
                  src={HERO_IMAGE_URL}
                  alt="Find your dream job"
                  fill
                  className="object-contain object-bottom drop-shadow-xl"
                  sizes="(max-width: 768px) 100vw, 600px"
                  priority
                  unoptimized
                />
              </div>

              {/* Floating Card 1: Skills Matched (Center Left, slightly overlapping arm but pushed outward) */}
              <div className="absolute top-[28%] left-[-2%] md:left-[1%] xl:left-[4%] z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col gap-2 min-w-[190px] hover:scale-105 transition-transform duration-300">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skills Matched</p>
                <div className="flex flex-col gap-1.5">
                  {["Python", "SQL", "Machine Learning"].map((skill) => (
                    <div key={skill} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <span className="flex items-center justify-center size-4 rounded-full bg-emerald-100 text-emerald-600">
                        <svg className="size-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                      {skill}
                    </div>
                  ))}
                </div>
                <Link href="/user/jobs" className="text-[10px] font-bold text-blue-600 hover:underline mt-1">
                  + 6 more
                </Link>
              </div>

              {/* Floating Card 2: AI Match Score (Top Right, pushed further right) */}
              <div className="absolute top-[4%] right-[-10%] md:right-[-12%] xl:right-[-10%] z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center gap-3 hover:scale-105 transition-transform duration-300">
                <div className="relative size-12 flex items-center justify-center shrink-0">
                  <svg className="size-full -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                    <circle cx="24" cy="24" r="20" fill="transparent" stroke="#2563eb" strokeWidth="4" strokeDasharray="125.6" strokeDashoffset="18.8" />
                  </svg>
                  <span className="absolute text-xs font-extrabold text-slate-900">85%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AI Match Score</span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Great Match
                  </span>
                </div>
              </div>

              {/* Floating Card 3: Jobs for You (Bottom Right, pushed further right) */}
              <div className="absolute bottom-[10%] right-[-8%] md:right-[-10%] xl:right-[-8%] z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center gap-3 hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-center size-10 rounded-xl bg-blue-50 text-blue-600">
                  <Briefcase className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">Jobs for You</span>
                  <span className="text-[10px] font-bold text-blue-600 mt-0.5">128 New Matches</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic HomePageClient sections */}
        <HomePageClient topCompanies={topCompanies} categories={categories} />
      </main>
    </div>
  );
}
