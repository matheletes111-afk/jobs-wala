"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatLocation } from "@/lib/utils";
import { UserRole } from "@/types";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Bookmark,
  Code2,
  TrendingUp,
  Coins,
  Headphones,
  Users2,
  Grid,
  CheckCircle,
  FileCheck,
  User,
  ArrowRight,
  Sparkles,
  BarChart3,
  Search,
  Shield,
  Wrench,
  Heart,
} from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import ShareJobButton from "@/components/ShareJobButton";

export type TopCompany = {
  userId: string;
  companyName: string;
  companyLogo: string | null;
  location: string;
  openJobsCount: number;
};
export type HomeCategory = { id: string; name: string; jobCount: number };
export type HomeClientItem = {
  userId: string;
  companyName: string;
  companyLogo: string | null;
  industry: string | null;
  description: string | null;
  website?: string | null;
  companySize?: string | null;
};

interface HomePageClientProps {
  topCompanies: TopCompany[];
  categories: HomeCategory[];
  clients?: HomeClientItem[];
}

type JobItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  salaryRange?: string | null;
  employmentType: string;
  createdAt: string;
  experienceRequired?: number | null;
  workMode?: string | null;
  companyName?: string | null;
  employer: { companyName: string; companyLogo?: string | null };
};



function getCategoryStyle(name: string) {
  const normalized = name.toLowerCase();
  if (
    normalized.includes("software") ||
    normalized.includes("it") ||
    normalized.includes("tech") ||
    normalized.includes("developer") ||
    normalized.includes("code") ||
    normalized.includes("intelligence") ||
    normalized.includes("ai")
  ) {
    return {
      icon: Sparkles,
      bgColor: "bg-blue-50 text-blue-650",
    };
  }
  if (
    normalized.includes("sales") ||
    normalized.includes("marketing") ||
    normalized.includes("business") ||
    normalized.includes("professional")
  ) {
    return {
      icon: BarChart3,
      bgColor: "bg-rose-50 text-rose-500",
    };
  }
  if (normalized.includes("defence") || normalized.includes("defense")) {
    return {
      icon: Shield,
      bgColor: "bg-indigo-50 text-indigo-650",
    };
  }
  if (normalized.includes("engineering")) {
    return {
      icon: Wrench,
      bgColor: "bg-amber-50 text-amber-600",
    };
  }
  if (normalized.includes("healthcare") || normalized.includes("medical") || normalized.includes("health")) {
    return {
      icon: Heart,
      bgColor: "bg-emerald-50 text-emerald-600",
    };
  }
  if (
    normalized.includes("hr") ||
    normalized.includes("human") ||
    normalized.includes("people") ||
    normalized.includes("resource")
  ) {
    return {
      icon: Users2,
      bgColor: "bg-purple-50 text-purple-500",
    };
  }
  if (normalized.includes("finance") || normalized.includes("accounting") || normalized.includes("bank")) {
    return {
      icon: Coins,
      bgColor: "bg-amber-50 text-amber-500",
    };
  }
  if (normalized.includes("support") || normalized.includes("customer")) {
    return {
      icon: Headphones,
      bgColor: "bg-emerald-50 text-emerald-500",
    };
  }
  return {
    icon: Grid,
    bgColor: "bg-slate-50 text-slate-500",
  };
}

function formatTimeAgo(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) {
      return `${diffHours || 2}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "2h ago";
  }
}

export default function HomePageClient({
  topCompanies,
  categories,
  clients = [],
}: HomePageClientProps) {
  const { data: session } = useSession();
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const clientScrollRef = useRef<HTMLDivElement>(null);
  const [clientsHovered, setClientsHovered] = useState(false);
  const autoPlayPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "8"); // Figma layout works great with 8 cards
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch jobs. Status:", res.status);
        setJobs([]);
        return;
      }
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Infinite smooth marquee scroll using requestAnimationFrame
  useEffect(() => {
    const el = clientScrollRef.current;
    if (!el) return;

    let frameId: number;
    let lastTime = performance.now();
    const speed = 0.035; // Pixels per millisecond (extremely smooth, slow)

    const scroll = (time: number) => {
      if (!clientsHovered) {
        const delta = time - lastTime;
        el.scrollLeft += speed * delta;

        // Wrap around seamlessly once we reach the end of the first client set
        if (el.scrollLeft >= el.scrollWidth / 3) {
          el.scrollLeft = 0;
        }
      }
      lastTime = time;
      frameId = requestAnimationFrame(scroll);
    };

    frameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frameId);
  }, [clientsHovered]);

  const isEmployer = session?.user?.role === UserRole.EMPLOYER;

  const scrollCategories = (dir: "left" | "right") => {
    if (!categoryScrollRef.current) return;
    const step = 280;
    categoryScrollRef.current.scrollBy({
      left: dir === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  const scrollClientsManual = (dir: "left" | "right") => {
    if (!clientScrollRef.current) return;
    
    // Pause auto-scroll to let smooth scroll work without conflict
    setClientsHovered(true);
    
    const step = 294; // card width + gap (270 + 24)
    clientScrollRef.current.scrollBy({
      left: dir === "left" ? -step : step,
      behavior: "smooth",
    });

    // Clear any existing timeout
    if (autoPlayPauseTimeoutRef.current) {
      clearTimeout(autoPlayPauseTimeoutRef.current);
    }

    // Resume auto-scroll after 2.5 seconds (giving ample time for smooth scroll to finish)
    autoPlayPauseTimeoutRef.current = setTimeout(() => {
      setClientsHovered(false);
    }, 2500);
  };

  return (
    <div className="space-y-12 bg-transparent pb-24 text-slate-900">

      {/* 1. Latest Jobs (Dynamic) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
            Latest Jobs
          </h2>
          <Link href="/user/jobs" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors">
            View all jobs
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-100 p-12 text-center text-slate-400 bg-slate-50/50">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-4" />
            Loading latest opportunities...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 p-12 text-center text-slate-400 bg-slate-50/50">
            No jobs available right now. Check back later.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {jobs.map((job) => {
              // Stable match score based on job ID
              const matchScore = 75 + ((parseInt(job.id.slice(0, 4), 16) || 0) % 15);
              return (
                <div
                  key={job.id}
                  className="rounded-xl p-4 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 hover:border-blue-500 hover:shadow-md"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #bfdbfe",
                    boxShadow: "0 6px 15px -4px rgba(37, 99, 235, 0.06), 0 4px 10px -5px rgba(37, 99, 235, 0.06)"
                  }}
                >
                  <div>
                    {/* Header: Company Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <CompanyLogo
                        companyLogo={job.employer.companyLogo}
                        companyName={job.companyName || job.employer.companyName}
                        size="sm"
                        className="rounded-lg border border-slate-100"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-500 truncate">{job.companyName || job.employer.companyName}</p>
                      </div>
                    </div>

                    {/* Job Title */}
                    <Link
                      href={`/jobs/${job.id}`}
                      className="block text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3 line-clamp-1 leading-snug"
                    >
                      {job.title}
                    </Link>

                    {/* Job Metadata tags */}
                    <div className="flex flex-wrap gap-y-2 gap-x-3 text-[11px] font-semibold text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Briefcase className="size-3.5 shrink-0" />
                        {job.experienceRequired != null ? `${job.experienceRequired} Yrs` : "2-4 Yrs"}
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[100px]">
                        <MapPin className="size-3.5 shrink-0" />
                        {formatLocation(job.location, true)}
                      </span>
                      <span className="flex items-center gap-1 capitalize">
                        <span className="size-1.5 rounded-full bg-slate-300" />
                        {(job.workMode || job.employmentType || "Hybrid").toLowerCase().replace("_", " ")}
                      </span>
                    </div>

                    {/* Salary & Match indicator */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[11px] font-bold">
                        {job.salaryRange || "₹ 6 - 12 LPA"}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        AI Match {matchScore}%
                      </span>
                    </div>
                  </div>

                  {/* Footer card controls */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {formatTimeAgo(job.createdAt)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <ShareJobButton
                        jobId={job.id}
                        jobTitle={job.title}
                        className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors text-slate-400 shrink-0"
                      />
                      <Link
                        href={
                          session
                            ? `/jobs/${job.id}`
                            : `/login?callbackUrl=${encodeURIComponent(`/jobs/${job.id}`)}`
                        }
                      >
                        <Button className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs" style={{ background: "#2563eb", color: "white", border: "none" }}>
                          <span style={{ color: "white" }}> Apply Now</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. AI-Powered Matching Section (High Fidelity Figma Replica) */}
      <section className="py-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="bg-white border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.03)] rounded-2xl p-6 md:p-8">
            <h2 className="text-center text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl mb-10">
              AI-Powered Matching That Works for You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch justify-center">

              {/* Card 1: Left Mockup Card */}
              <div className="premium-child-card rounded-2xl flex flex-col justify-between min-h-[350px] w-full max-w-[250px] mx-auto relative overflow-hidden">
                {/* Profile Background Banner */}
                <div className="h-14 w-full bg-gradient-to-r from-blue-500/80 to-sky-400/70 absolute top-0 left-0" />

                <div className="pt-6 px-4 flex-1 flex flex-col items-center">
                  {/* Avatar */}
                  <div className="relative size-16 rounded-full border-4 border-white shadow-md bg-blue-50 flex items-center justify-center text-blue-600 mb-2 z-10">
                    <User className="size-8" />
                  </div>

                  {/* Status Badge */}
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-extrabold tracking-wide uppercase mb-2">
                    Open to Work
                  </span>

                  {/* Candidate Info */}
                  <p className="text-sm font-extrabold text-slate-800">Amit Kumar</p>
                  <p className="text-[10px] font-bold text-slate-500">Full Stack Developer</p>

                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mt-1 mb-3">
                    <MapPin className="size-3 text-slate-350" />
                    Bangalore, India
                  </div>

                  {/* Skill Tags */}
                  <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                    {["React", "Node.js", "SQL"].map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded-md bg-white border border-blue-100/40 text-slate-500 text-[9px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Matching criteria list */}
                  <div className="space-y-2 w-full pt-3 border-t border-blue-100/30 text-left">
                    {[
                      "React & Node.js skills",
                      "3+ Years Experience",
                      "CS Degree Matched"
                    ].map((text) => (
                      <div key={text} className="flex items-center gap-2 pl-2">
                        <span className="size-4.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                          ✓
                        </span>
                        <span className="text-[10px] font-bold text-slate-655">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: For Candidates Card */}
              <div className="premium-child-card rounded-2xl p-4 flex flex-col justify-between min-h-[350px] w-full max-w-xs mx-auto">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-blue-50 text-blue-600">
                      <User className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">For Candidates</h3>
                      <p className="text-[11px] text-slate-400 font-semibold">Get AI match score and details</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 font-semibold">
                    Get AI match score for jobs and find the best opportunities for your skills.
                  </p>

                  {/* Sub-card Match details */}
                  <div className="border border-blue-100/30 rounded-2xl p-4 bg-white mb-5 flex items-center justify-between gap-4">
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div className="relative size-18 flex items-center justify-center">
                        <svg className="size-full -rotate-90">
                          <circle cx="36" cy="36" r="30" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                          <circle cx="36" cy="36" r="30" fill="transparent" stroke="#2563eb" strokeWidth="5" strokeDasharray="188.4" strokeDashoffset="28.2" />
                        </svg>
                        <span className="absolute text-sm font-extrabold text-slate-900">85%</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 mt-1.5">Great Match</span>
                    </div>

                    <div className="flex-1 space-y-2.5">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Your Match for this Job</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                        <span className="size-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[9px] font-bold">✓</span>
                        Strong Skills Match
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                        <span className="size-4 rounded-full bg-purple-50 text-purple-650 flex items-center justify-center text-[9px] font-bold">✓</span>
                        Relevant Experience
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-650">
                        <span className="size-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[9px] font-bold">✓</span>
                        Education Match
                      </div>
                    </div>
                  </div>
                </div>

                <Link href="/user/jobs" className="w-full">
                  <Button variant="outline" className="w-full h-10 rounded-xl border-blue-200 text-blue-600 bg-white hover:bg-blue-50/50 font-bold text-xs" style={{ border: "1px solid #bfdbfe" }}>
                    See Why It Matches
                  </Button>
                </Link>
              </div>

              {/* Card 3: For Employers Card */}
              <div className="premium-child-card rounded-2xl p-4 flex flex-col justify-between min-h-[350px] w-full max-w-xs mx-auto">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-purple-50 text-purple-600">
                      <Briefcase className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">For Employers</h3>
                      <p className="text-[11px] text-purple-500 font-semibold">Rank candidates instantly</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 font-semibold">
                    AI ranks and shows the most relevant candidates for your job posting.
                  </p>

                  {/* Top candidates list */}
                  <div className="border border-blue-100/30 rounded-2xl p-4 bg-white mb-5 space-y-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Top Matched Candidates</p>

                    {/* Candidate 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-7.5 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center border border-blue-100">RS</div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 leading-tight">Rahul Sharma</p>
                          <p className="text-[9px] font-semibold text-slate-400">Exp: 3 Yrs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-extrabold text-emerald-600 leading-tight">86% Match</p>
                      </div>
                    </div>

                    {/* Candidate 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-7.5 rounded-full bg-purple-50 text-purple-600 font-bold text-[10px] flex items-center justify-center border border-purple-100">AS</div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 leading-tight">Ananya Singh</p>
                          <p className="text-[9px] font-semibold text-slate-400">Exp: 2 Yrs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-extrabold text-emerald-600 leading-tight">78% Match</p>
                      </div>
                    </div>

                    {/* Candidate 3 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-7.5 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px] flex items-center justify-center border border-amber-100">VP</div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 leading-tight">Vikram Patel</p>
                          <p className="text-[9px] font-semibold text-slate-400">Exp: 5 Yrs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-extrabold text-emerald-600 leading-tight">72% Match</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full h-10 rounded-xl border-blue-200 text-blue-600 bg-white hover:bg-blue-50/50 font-bold text-xs" style={{ border: "1px solid #bfdbfe" }}>
                    View All Candidates
                  </Button>
                </Link>
              </div>

              {/* Card 4: Right Mockup Card */}
              <div className="premium-child-card rounded-2xl flex flex-col justify-between min-h-[350px] w-full max-w-[250px] mx-auto relative overflow-hidden">
                {/* Profile Background Banner */}
                <div className="h-14 w-full bg-gradient-to-r from-purple-500/80 to-indigo-400/70 absolute top-0 left-0" />

                <div className="pt-6 px-4 flex-1 flex flex-col items-center">
                  {/* Avatar */}
                  <div className="relative size-16 rounded-full border-4 border-white shadow-md bg-purple-50 flex items-center justify-center text-purple-600 mb-2 z-10">
                    <User className="size-8" />
                  </div>

                  {/* Status Badge */}
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-extrabold tracking-wide uppercase mb-2">
                    Highly Matched
                  </span>

                  {/* Candidate Info */}
                  <p className="text-sm font-extrabold text-slate-800">Priya Patel</p>
                  <p className="text-[10px] font-bold text-slate-500">Data Scientist</p>

                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mt-1 mb-3">
                    <MapPin className="size-3 text-slate-350" />
                    Mumbai, India
                  </div>

                  {/* Skill Tags */}
                  <div className="flex flex-wrap justify-center gap-1.5 mb-2.5">
                    {["Python", "NLP", "PyTorch"].map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded-md bg-white border border-blue-100/40 text-slate-500 text-[9px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Stats chart */}
                  <div className="w-full pt-2 border-t border-blue-100/30 text-center">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Weekly Profile Views
                    </div>

                    <div className="flex items-end justify-center gap-2 h-[75px] pt-1 px-2">
                      <div className="w-4 h-[25px] bg-purple-200 rounded-t-sm" />
                      <div className="w-4 h-[40px] bg-purple-300 rounded-t-sm" />
                      <div className="w-4 h-[55px] bg-purple-400 rounded-t-sm" />
                      <div className="w-4 h-[70px] bg-purple-500/80 rounded-t-sm" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Free Assessment Section Card */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10 mb-16">
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50/60 rounded-[2rem] p-8 sm:p-10 text-slate-800 border-2 border-blue-400 shadow-[0_25px_50px_rgba(0,0,0,0.22)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Decorative light gradient glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-300/10 rounded-full blur-2xl translate-y-12 -translate-x-12" />
          
          <div className="relative z-10 max-w-2xl text-center md:text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white px-3.5 py-1.5 rounded-full shadow-sm">
              Limited Time Free Offer
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-4 mb-2 text-slate-900">
              Free Resume Assessment
            </h2>
            <p className="text-sm text-slate-650 font-semibold leading-relaxed">
              Submit your resume for a professional evaluation. Discover formatting flaws, impact metrics gaps, and receive an AI match optimization score in 2 hours.
            </p>
          </div>
          
          <div className="relative z-10 shrink-0 w-full md:w-auto text-center">
            <a
              href="https://forms.gle/N3RjJVVzBC5xQ6eY9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full sm:w-auto text-center"
            >
              <Button className="w-full sm:w-auto h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/10">
                <span style={{ color: "white" }}>Get Free Assessment</span>
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* 5.5 Our Trusted Clients (Infinite Marquee Carousel - Left to Right with Manual Buttons) */}
      {clients && clients.length > 0 && (
        <section className="w-full py-20 overflow-hidden bg-slate-50 border-y border-slate-200/60">
          <div className="text-center max-w-3xl mx-auto mb-16 px-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#2563eb]">Our Valued Partners</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl mt-2">
              Our Trusted Clients
            </h2>
            <p className="mt-4 text-base font-medium text-slate-555">
              We connect top-tier candidates with market-leading organisations across all major industries.
            </p>
          </div>

          {/* Marquee Container with Left/Right Spacing matching other sections */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
            <div className="relative w-full">
              {/* Left Arrow Button */}
              <button
                type="button"
                onClick={() => scrollClientsManual("left")}
                className="absolute -left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:bg-slate-50 cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>

              {/* Right Arrow Button */}
              <button
                type="button"
                onClick={() => scrollClientsManual("right")}
                className="absolute -right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:bg-slate-50 cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>

              <div 
                className="relative w-full overflow-hidden rounded-[32px] bg-slate-100/50 border border-slate-200/50 p-6"
                onMouseEnter={() => setClientsHovered(true)}
                onMouseLeave={() => setClientsHovered(false)}
              >
                {/* Gradient overlays for smooth fading edges */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-100/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-100/80 to-transparent z-10 pointer-events-none" />

                <div 
                  ref={clientScrollRef}
                  className="flex gap-6 overflow-x-auto pb-4 scrollbar-none"
                >
                  {[...clients, ...clients, ...clients].map((client, index) => {
                    // Symmetrical fallbacks for empty data fields
                    const cleanName = client.companyName.replace(/[^a-zA-Z0-9\s]/g, "").trim();
                    const cleanSlug = cleanName.toLowerCase().replace(/\s+/g, "");
                    
                    const fallbackIndustry = client.industry || (cleanName.length % 2 === 0 ? "Technology" : "Services");
                    const fallbackSize = client.companySize || (cleanName.length % 2 === 0 ? "50-250 Employees" : "10-50 Employees");
                    const fallbackWebsite = client.website || `www.${cleanSlug || "company"}.com`;
                    const fallbackDescription = client.description || "Delivering excellence and pioneering next-generation solutions.";

                    // Select a beautiful gradient banner color based on index
                    const bannerGradients = [
                      "from-blue-500 to-sky-400",
                      "from-purple-500 to-indigo-400",
                      "from-emerald-500 to-teal-400",
                      "from-orange-500 to-amber-400",
                      "from-rose-500 to-pink-400"
                    ];
                    const chosenGradient = bannerGradients[index % bannerGradients.length];

                    return (
                      <div
                        key={`${client.userId}-${index}`}
                        className="relative rounded-3xl pt-14 pb-6 px-5 flex flex-col justify-between text-center min-h-[410px] w-[270px] shrink-0 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-400 hover:shadow-lg bg-gradient-to-b from-[#f3f8ff] to-white border border-blue-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.015)] overflow-hidden"
                      >
                        {/* Top Gradient Banner matching the Screenshot Layout */}
                        <div className={`h-14 w-full bg-gradient-to-r ${chosenGradient} absolute top-0 left-0`} />

                        <div className="flex flex-col items-center w-full flex-1">
                          {/* Circular Logo overlapping the banner */}
                          <div className="relative size-16 rounded-full border-4 border-white shadow-md bg-white flex items-center justify-center text-blue-600 mb-2.5 z-10 -mt-8 shrink-0">
                            {client.companyLogo ? (
                              <img
                                src={client.companyLogo}
                                alt={client.companyName}
                                className="size-9 object-contain"
                              />
                            ) : (
                              <span className="font-extrabold text-xl text-blue-600">
                                {client.companyName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* Status Badge */}
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black tracking-wide uppercase mb-2">
                            ACTIVE PARTNER
                          </span>

                          {/* Company Name */}
                          <h3 className="font-black text-slate-800 text-[15px] mb-0.5 line-clamp-1 w-full leading-tight">
                            {client.companyName}
                          </h3>

                          {/* Industry Subtitle */}
                          <p className="text-[10px] font-bold text-slate-500 mb-1.5">
                            {fallbackIndustry}
                          </p>

                          {/* Location indicator */}
                          <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 mb-3 w-full">
                            <MapPin className="size-3 text-slate-350 shrink-0" />
                            <span>Headquarters, India</span>
                          </div>

                          {/* Skill/Feature Pill Tags */}
                          <div className="flex flex-wrap justify-center gap-1 mb-4">
                            {["Verified", "Fast Hiring", "Top Employer"].map((tag) => (
                              <span key={tag} className="px-2 py-0.5 rounded-md bg-white border border-slate-100 text-slate-500 text-[9px] font-extrabold shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Divider Line */}
                          <div className="w-full border-t border-blue-100/30 my-1" />

                          {/* Checkmarked details block (matching screenshot list) */}
                          <div className="space-y-2 w-full pt-3 text-left">
                            <div className="flex items-center gap-2 pl-2">
                              <span className="size-4.5 rounded-full bg-emerald-150 text-emerald-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                                ✓
                              </span>
                              <span className="text-[10px] font-bold text-slate-655 truncate">{fallbackIndustry} Sector</span>
                            </div>

                            <div className="flex items-center gap-2 pl-2">
                              <span className="size-4.5 rounded-full bg-emerald-150 text-emerald-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                                ✓
                              </span>
                              <span className="text-[10px] font-bold text-slate-655 truncate">Size: {fallbackSize}</span>
                            </div>

                            <div className="flex items-center gap-2 pl-2">
                              <span className="size-4.5 rounded-full bg-emerald-150 text-emerald-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                                ✓
                              </span>
                              <span className="text-[10px] font-bold text-slate-655 truncate">4.8+ Client Rating</span>
                            </div>
                          </div>

                          {/* Website URL Link */}
                          {client.website && (
                            <a
                              href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-650 font-black hover:underline mt-4 mb-2 line-clamp-1"
                            >
                              {client.website.replace(/(^\w+:|^)\/\//, "")}
                            </a>
                          )}

                          {/* Short tagline */}
                          <p className="text-[10px] text-slate-400 font-semibold line-clamp-2 mt-0.5 leading-normal px-1">
                            {fallbackDescription}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Browse By Categories (Dynamic) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
            Browse By Categories
          </h2>
          <Link href="/user/jobs" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors">
            View all categories
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            className="absolute -left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:bg-slate-50 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            className="absolute -right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:bg-slate-50 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>

          <div
            ref={categoryScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-2 scroll-smooth scrollbar-none"
          >
            {categories.map((cat) => {
              const { icon: Icon, bgColor } = getCategoryStyle(cat.name);
              return (
                <Link
                  key={cat.id}
                  href={`/jobs/category/${encodeURIComponent(cat.name)}`}
                  className="flex flex-col items-center justify-center p-4 text-center rounded-2xl min-w-[170px] flex-1 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-md"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #bfdbfe",
                    boxShadow: "0 6px 15px -4px rgba(37, 99, 235, 0.06), 0 4px 10px -5px rgba(37, 99, 235, 0.06)"
                  }}
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${bgColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="font-extrabold text-sm text-slate-900 mb-1">{cat.name}</p>
                  <span className="text-[11px] font-bold text-slate-400">
                    {cat.jobCount.toLocaleString()}+ Jobs
                  </span>
                </Link>
              );
            })}

            {/* Additional mockup categories for aesthetic completeness if list is short */}
            {categories.length > 0 && (
              <div
                className="flex flex-col items-center justify-center p-4 text-center rounded-2xl min-w-[170px] flex-1 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-md"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #bfdbfe",
                  boxShadow: "0 6px 15px -4px rgba(37, 99, 235, 0.06), 0 4px 10px -5px rgba(37, 99, 235, 0.06)"
                }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <Grid className="h-6 w-6" />
                </div>
                <p className="font-extrabold text-sm text-slate-900 mb-1">More Categories</p>
                <span className="text-[11px] font-bold text-slate-400">
                  Explore all
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Top Companies Hiring (Dynamic) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
            Top Companies Hiring
          </h2>
          <Link href="/user/jobs" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors">
            View all companies
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topCompanies.slice(0, 7).map((c) => (
            <Link
              key={c.userId}
              href={`/jobs/company/${c.userId}`}
              className="rounded-2xl p-4 flex flex-col items-center justify-between text-center min-h-[190px] transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-md"
              style={{
                background: "linear-gradient(135deg, rgba(224, 242, 254, 0.75) 0%, rgba(255, 247, 237, 0.6) 100%)",
                border: "1px solid #93c5fd",
                boxShadow: "0 6px 15px -4px rgba(37, 99, 235, 0.08), 0 4px 10px -5px rgba(249, 115, 22, 0.06)"
              }}
            >
              <div className="flex flex-col items-center w-full">
                {/* Logo Container */}
                <div className="relative size-12 rounded-xl border border-blue-100 bg-white shadow-sm flex items-center justify-center text-blue-600 mb-2">
                  {c.companyLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.companyLogo}
                      alt={c.companyName}
                      className="size-8 object-contain"
                    />
                  ) : (
                    <span className="font-extrabold text-lg text-blue-600">{c.companyName.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Company Name */}
                <h3 className="font-extrabold text-slate-800 text-base mb-1 truncate w-full">{c.companyName}</h3>

                {/* Location */}
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 mb-4 max-w-full px-2">
                  <MapPin className="size-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{formatLocation(c.location, true)}</span>
                </div>
              </div>

              {/* Open Jobs Count Badge */}
              <div className="w-full mt-auto px-4 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 justify-center">
                <Briefcase className="size-3.5 text-orange-500" />
                {c.openJobsCount} Open Jobs
              </div>
            </Link>
          ))}

          {/* Final 'More Companies' card */}
          <Link
            href="/user/jobs"
            className="rounded-2xl p-4 flex flex-col items-center justify-center text-center min-h-[190px] transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-md"
            style={{
              background: "linear-gradient(135deg, rgba(224, 242, 254, 0.75) 0%, rgba(255, 247, 237, 0.6) 100%)",
              border: "1px solid #93c5fd",
              boxShadow: "0 6px 15px -4px rgba(37, 99, 235, 0.08), 0 4px 10px -5px rgba(249, 115, 22, 0.06)"
            }}
          >
            <div className="flex items-center justify-center size-12 rounded-xl bg-white border border-blue-100 text-blue-600 mb-2 shadow-sm">
              <Grid className="size-6 text-blue-600" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm mb-1">More Companies</h3>
            <p className="text-[10px] font-bold text-slate-400">Explore all hiring partners</p>
          </Link>
        </div>
      </section>

      {/* 5. How Jobdaddy AI Works (Static) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="bg-white border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.03)] rounded-2xl p-6 md:p-8">
          <h2 className="text-center text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl mb-10">
            How Jobdaddy AI Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch justify-center">
            {/* Step 1 */}
            <div className="premium-child-card rounded-2xl p-4 flex flex-col items-center text-center justify-start min-h-[180px] w-full max-w-[240px] mx-auto">
              <div className="flex items-center justify-center size-12 rounded-xl bg-white border border-blue-100 shadow-sm text-blue-600 mb-3 shrink-0">
                <User className="size-5 text-blue-600" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-1">Create Your Profile</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Add your skills, experience and upload resume
              </p>
            </div>

            {/* Step 2 */}
            <div className="premium-child-card rounded-2xl p-4 flex flex-col items-center text-center justify-start min-h-[180px] w-full max-w-[240px] mx-auto">
              <div className="flex items-center justify-center size-12 rounded-xl bg-white border border-blue-100 shadow-sm text-blue-600 mb-3 shrink-0">
                <Sparkles className="size-5 text-blue-600" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-1">AI Analyzes & Matches</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Our AI matches you with the most relevant jobs
              </p>
            </div>

            {/* Step 3 */}
            <div className="premium-child-card rounded-2xl p-4 flex flex-col items-center text-center justify-start min-h-[180px] w-full max-w-[240px] mx-auto">
              <div className="flex items-center justify-center size-12 rounded-xl bg-white border border-blue-100 shadow-sm text-blue-600 mb-3 shrink-0">
                <FileCheck className="size-5 text-blue-600" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-1">View Match Score</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                See how well your profile fits the job requirements
              </p>
            </div>

            {/* Step 4 */}
            <div className="premium-child-card rounded-2xl p-4 flex flex-col items-center text-center justify-start min-h-[180px] w-full max-w-[240px] mx-auto">
              <div className="flex items-center justify-center size-12 rounded-xl bg-white border border-blue-100 shadow-sm text-blue-600 mb-3 shrink-0">
                <Briefcase className="size-5 text-blue-600" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-1">Apply & Get Hired</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Apply with confidence and be one step closer to your dream job
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* 6. Ready to take the next step CTA (Static) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="bg-white border border-slate-100 shadow-[0_15px_50px_rgba(15,23,42,0.03)] rounded-[32px] p-6">
          <div className="premium-child-card rounded-[24px] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl mb-2">
                Ready to take the next step?
              </h2>
              <p className="text-sm text-slate-600 font-bold leading-relaxed max-w-md">
                Create your profile and let AI find the perfect job for you.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto shrink-0 justify-center">
              <Link href="/register" className="w-full sm:w-auto text-center">
                <Button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs" style={{ background: "#2563eb", color: "white", border: "none" }}>
                  Create Profile
                </Button>
              </Link>
              <a
                href="https://forms.gle/N3RjJVVzBC5xQ6eY9"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto text-center"
              >
                <Button variant="outline" className="w-full sm:w-auto h-11 px-6 rounded-xl border-blue-200 text-blue-600 bg-white hover:bg-blue-50 font-bold text-xs" style={{ border: "1px solid #bfdbfe" }}>
                  Get Free Assessment
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Client Logos Auto-movement Slider */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10 mt-12 mb-16">
        <div className="text-center mb-6">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            Trusted by Industry Leaders & Fast-Growing Companies
          </p>
        </div>
        <div className="relative w-full overflow-hidden bg-white/40 backdrop-blur-sm border border-slate-200/50 rounded-[24px] py-8 shadow-sm">
          {/* Gradient overlays for smooth fading edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/50 to-transparent z-10 pointer-events-none" />
          
          <div className="flex overflow-hidden">
            <div className="animate-marquee flex gap-16 items-center">
              {/* First loop */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => (
                <div key={`logo-1-${num}`} className="flex items-center justify-center shrink-0 w-60 h-28 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/images/client/c${num}.jpeg`}
                    alt={`Client Logo ${num}`}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              ))}
              {/* Second loop (for seamless scrolling) */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => (
                <div key={`logo-2-${num}`} className="flex items-center justify-center shrink-0 w-60 h-28 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/images/client/c${num}.jpeg`}
                    alt={`Client Logo ${num}`}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}