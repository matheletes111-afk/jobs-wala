import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@prisma/client";
import { CategoryStatus } from "@prisma/client";
import HomePageClient from "@/components/HomePageClient";
import Header from "@/components/Header";
import { formatLocation } from "@/lib/utils";
import { Briefcase, FileText, Search, Send, ChevronDown } from "lucide-react";

import HomeSlider from "@/components/HomeSlider";

const HERO_IMAGE_URL = "/images/home_img.png";

export default async function HomePage() {
  const user = await getCurrentUser();

  // Top companies: employers with ACTIVE jobs (ordered by job count) + location + open jobs count
  const jobCounts = await prisma.job.groupBy({
    by: ["postedBy"],
    where: {
      status: "ACTIVE",
      employer: { approvalStatus: "APPROVED" }
    },
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
      where: {
        postedBy: { in: userIds },
        status: "ACTIVE",
        employer: { approvalStatus: "APPROVED" }
      },
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
  const seenTopNames = new Set<string>();
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
    .filter(Boolean)
    .filter((c) => {
      if (!c) return false;
      const name = c.companyName.toLowerCase().trim();
      const isDummy =
        name.includes("asdf") ||
        name.includes("xyz") ||
        name.includes("demo") ||
        name.includes("vipro") ||
        name.includes("srv") ||
        name.includes("test") ||
        name.includes("abc") ||
        name.includes("abac") ||
        name.includes("temp") ||
        name.includes("qwer") ||
        name.includes("sample") ||
        name.includes("dummy") ||
        name.length <= 3;

      if (isDummy) return false;
      if (seenTopNames.has(name)) return false;
      seenTopNames.add(name);
      return true;
    }) as {
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

  const rawClients = await prisma.employerProfile.findMany({
    where: { approvalStatus: "APPROVED" },
    take: 30,
    select: {
      userId: true,
      companyName: true,
      companyLogo: true,
      industry: true,
      description: true,
      website: true,
      companySize: true,
    },
  });

  const seenClientNames = new Set<string>();
  const clients = rawClients
    .filter((c) => {
      const name = c.companyName.toLowerCase().trim();
      const isDummy =
        name.includes("asdf") ||
        name.includes("xyz") ||
        name.includes("demo") ||
        name.includes("vipro") ||
        name.includes("srv") ||
        name.includes("test") ||
        name.includes("abc") ||
        name.includes("abac") ||
        name.includes("temp") ||
        name.includes("qwer") ||
        name.includes("sample") ||
        name.includes("dummy") ||
        name.length <= 3;

      if (isDummy) return false;
      if (seenClientNames.has(name)) return false;
      seenClientNames.add(name);
      return true;
    })
    .slice(0, 15);

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent selection:bg-primary/20">
      <Header />

      <main className="flex-1 relative bg-transparent">
        {/* Hero / Banner with Background Slider */}
        <section className="relative w-full mx-auto max-w-[1440px] px-2 sm:px-4 md:px-6 pt-0 mb-12 sm:mb-16 bg-transparent">
          <div className="rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100/50">
            <HomeSlider>
              <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 lg:flex-row lg:justify-between lg:items-center px-4 py-12 sm:px-6 md:px-8 lg:px-10 xl:px-12">

                {/* Left Column: Title, Description, and Search */}
                <div className="min-w-0 max-w-2xl flex-1 text-center lg:text-left relative z-20">
                  <h1 className="mb-6 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl leading-tight">
                    <span style={{ color: "#ffffff" }}>Stop Getting Rejected</span> <br />
                    <span style={{ color: "#ffffff" }}>Get Your Super Resume</span> <br />
                    <span style={{ color: "#ff6a00ff" }}>+ AI-Matched Jobs</span> <br />
                    <span className="text-sm font-semibold tracking-wide uppercase opacity-90 block mt-2 text-sky-200">- Built by India's Wolf of the Job Street</span>
                  </h1>

                  {/* Action CTAs */}
                  <div className="flex flex-wrap gap-4 mb-8 justify-center lg:justify-start">
                    <Link href="/user/jobs">
                      <Button className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md shadow-blue-500/10">
                        Find a Job
                      </Button>
                    </Link>
                    <Link href="/career-services">
                      <Button className="h-11 px-6 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md shadow-orange-500/10">
                        Get Super Resume ₹999+
                      </Button>
                    </Link>
                    <Link href="/employer/jobs/new">
                      <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 bg-white shadow-sm">
                        Post a Job
                      </Button>
                    </Link>
                  </div>

                  {/* Search Section - High Fidelity replica of Figma */}
                  <div className="bg-sky-50/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-5 md:p-6 w-full max-w-xl mx-auto lg:mx-0 mb-6 relative z-20">
                    <p className="mb-6 text-xs md:text-sm text-slate-500 font-semibold text-left leading-relaxed">
                      Our AI technology matches your skills with the right opportunities, so you can focus on what matters – building your future.
                    </p>
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

                {/* Right Column: Hero Boy Image with Floating Badges (Hidden but not removed) */}
                <div style={{ display: "none" }} className="relative z-30 w-full max-w-lg lg:max-w-xl shrink-0 h-[360px] sm:h-[420px] md:h-[480px] lg:h-[540px] xl:h-[600px] flex items-end justify-center -translate-y-8 sm:-translate-y-12 lg:-translate-y-20 xl:-translate-y-24 lg:-translate-x-12 xl:-translate-x-20 transition-all">

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

                  {/* Floating Card 1: Skills Matched */}
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

                  {/* Floating Card 2: AI Match Score */}
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

                  {/* Floating Card 3: Jobs for You */}
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
            </HomeSlider>
          </div>
        </section>

        {/* Dynamic HomePageClient sections */}
        <HomePageClient topCompanies={topCompanies} categories={categories} clients={clients} />
      </main>
    </div>
  );
}
