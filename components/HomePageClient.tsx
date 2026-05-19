"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatLocation } from "@/lib/utils";
import { UserRole } from "@/types";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  MapPin,
  LayoutGrid,
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

type JobItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  salaryRange?: string | null;
  employmentType: string;
  createdAt: string;
  employer: { companyName: string; companyLogo?: string | null };
};

interface HomePageClientProps {
  topCompanies: TopCompany[];
  categories: HomeCategory[];
}

const EMPLOYMENT_BADGE_COLORS: Record<string, string> = {
  FULL_TIME: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  PART_TIME: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
  CONTRACT: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  FREELANCE: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  INTERNSHIP: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  REMOTE: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

function getEmploymentBadgeClass(type: string): string {
  return EMPLOYMENT_BADGE_COLORS[type] ?? "bg-gray-100 text-gray-800";
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function HomePageClient({
  topCompanies,
  categories,
}: HomePageClientProps) {
  const { data: session } = useSession();
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "9");
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch (e) {
      console.error(e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const isJobSeeker = session?.user?.role === UserRole.JOB_SEEKER;
  const isEmployer = session?.user?.role === UserRole.EMPLOYER;

  const scrollCategories = (dir: "left" | "right") => {
    if (!categoryScrollRef.current) return;
    const step = 280;
    categoryScrollRef.current.scrollBy({
      left: dir === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Top Companies are Hiring - card grid */}
      {topCompanies.length > 0 && (
        <section className="bg-background py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
            <p className="text-center text-sm font-bold tracking-[0.2em] text-[#22c55e] uppercase mb-2">
              Our Partners
            </p>
            <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:mb-12 sm:text-3xl md:text-4xl">
              Top Companies are <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Hiring</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-4">
              {topCompanies.map((c) => (
                <Link
                  key={c.userId}
                  href={`/jobs/company/${c.userId}`}
                  className="linear-card group flex flex-col items-center p-8 text-center animate-premium-hover"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-blue-500/5 border border-blue-500/10 text-2xl font-black text-[#2563eb] transition-all group-hover:bg-blue-500/10 group-hover:scale-110">
                    {c.companyLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.companyLogo}
                        alt=""
                        className="h-full w-full object-cover transition-opacity opacity-80 group-hover:opacity-100"
                      />
                    ) : (
                      (c.companyName[0] ?? "?").toUpperCase()
                    )}
                  </div>
                  <p className="font-bold text-foreground sm:text-lg">{c.companyName}</p>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#22c55e]/70" />
                    {c.location}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-500/5 border border-orange-500/10 px-4 py-1.5 text-xs font-bold text-[#f97316] uppercase tracking-wide">
                    <Briefcase className="h-3.5 w-3.5" />
                    {c.openJobsCount} Open Jobs
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <Button
                variant="outline"
                className="rounded-full border-white/10 hover:bg-white/5 transition-all hover:scale-105 active:scale-95"
                asChild
              >
                <Link href="/user/jobs">View Featured Companies</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Browse Jobs By Categories - horizontal scroll */}
      {categories.length > 0 && (
        <section className="py-16 sm:py-20 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
            <p className="text-center text-sm font-bold tracking-[0.2em] text-[#22c55e] uppercase mb-2">
              Explore Opportunities
            </p>
            <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:mb-12 sm:text-3xl md:text-4xl">
              Browse By <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">Categories</span>
            </h2>
            <div className="relative">
              <button
                type="button"
                onClick={() => scrollCategories("left")}
                className="absolute -left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-background/80 backdrop-blur-md shadow-xl transition-all hover:bg-white/10 hover:scale-110 active:scale-95 disabled:opacity-0"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-6 w-6 text-foreground" />
              </button>
              <button
                type="button"
                onClick={() => scrollCategories("right")}
                className="absolute -right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-background/80 backdrop-blur-md shadow-xl transition-all hover:bg-white/10 hover:scale-110 active:scale-95 disabled:opacity-0"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-6 w-6 text-foreground" />
              </button>
              <div
                ref={categoryScrollRef}
                className="flex gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth scrollbar-none"
              >
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/jobs/category/${encodeURIComponent(cat.name)}`}
                    className="linear-card group flex min-w-[240px] flex-col items-center p-8 text-center animate-premium-hover"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 font-bold transition-all group-hover:bg-indigo-500/10 group-hover:scale-110 group-hover:rotate-3">
                      <LayoutGrid className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-foreground mb-1">{cat.name}</p>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-full group-hover:bg-white/10 transition-colors">
                      {cat.jobCount} Jobs
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Jobs - card grid */}
      <section className="bg-background py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10">
          <p className="text-center text-sm font-bold tracking-[0.2em] text-[#22c55e] uppercase mb-2">
            New Opportunities
          </p>
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:mb-12 sm:text-3xl md:text-4xl">
            Latest Jobs <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#2563eb]">Feed</span>
          </h2>

          {loading ? (
            <div className="linear-card rounded-2xl p-12 text-center text-muted-foreground">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="linear-card rounded-2xl p-12 text-center text-muted-foreground">
              No jobs available right now. Check back later.
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job, idx) => (
                  <div
                    key={job.id}
                    className="linear-card group flex flex-col p-8 animate-premium-hover animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold shadow-sm ${getEmploymentBadgeClass(
                          job.employmentType
                        )}`}
                      >
                        {job.employmentType.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <ShareJobButton jobId={job.id} jobTitle={job.title} className="h-9 w-9 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" />
                        <CompanyLogo
                          companyLogo={job.employer.companyLogo}
                          companyName={job.employer.companyName}
                          size="md"
                          className="rounded-xl border border-white/10"
                        />
                      </div>
                    </div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="mt-6 block text-xl font-bold text-foreground decoration-primary/30 decoration-2 underline-offset-4 transition-all hover:text-primary hover:underline"
                    >
                      {job.title}
                    </Link>
                    <div className="mt-2 flex flex-col gap-1.5">
                      <p className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                        {job.employer.companyName}
                      </p>
                      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-[#2563eb]/70" />
                        {formatLocation(job.location, true)}
                      </p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Posted {formatDate(job.createdAt)}
                      </p>
                      <div className="w-1/2">
                        {isEmployer ? (
                          <Link href={`/jobs/${job.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-foreground/70 hover:text-foreground hover:bg-white/5"
                            >
                              Details
                            </Button>
                          </Link>
                        ) : (
                        <Link
                          href={
                            session
                              ? `/jobs/${job.id}`
                              : `/login?callbackUrl=${encodeURIComponent(`/jobs/${job.id}`)}`
                          }
                          className="w-full"
                        >
                          <Button
                            className="w-full btn-gradient h-12 rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            Apply Now
                          </Button>
                        </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-16 flex justify-center">
                <Button
                  className="rounded-full bg-white/5 border border-white/10 px-10 py-6 text-foreground font-bold hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
                  asChild
                >
                  <Link href="/user/jobs">Explore All Jobs</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}