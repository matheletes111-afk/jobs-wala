"use client";

import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatLocation } from "@/lib/utils";
import { UserRole } from "@/types";
import { MapPin, LayoutGrid, List, ChevronDown } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import ShareJobButton from "@/components/ShareJobButton";

type JobItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  salaryRange?: string | null;
  employmentType: string;
  createdAt: string;
  companyName?: string | null;
  employer: { companyName: string; companyLogo?: string | null };
};

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

interface JobsFilterPageClientProps {
  title: string;
  category?: string;
  employerId?: string;
}

export default function JobsFilterPageClient({
  title,
  category,
  employerId,
}: JobsFilterPageClientProps) {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const limit = 50;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (category) params.set("category", category);
      if (employerId) params.set("employerId", employerId);
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs((data.jobs ?? []) as JobItem[]);
      setTotal(data.total ?? 0);
    } catch (e) {
      console.error(e);
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, category, employerId]);

  const sortedJobs = sort === "oldest" ? [...jobs].reverse() : jobs;

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const totalPages = Math.ceil(total / limit);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const isJobSeeker = session?.user?.role === UserRole.JOB_SEEKER;
  const isEmployer = session?.user?.role === UserRole.EMPLOYER;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-bold text-white sm:text-3xl">{title}</h1>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
          Loading jobs...
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-foreground/70">
              <span className="font-bold text-[#f97316]">{total} Jobs Found</span>
              <span className="ml-2 text-sm text-white/50">
                Showing {start} - {end} of {total} results
              </span>
            </p>
            <div className="flex items-center gap-4">
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg p-2 transition-all duration-200 ${viewMode === "grid" ? "toggle-active scale-110" : "text-muted-foreground hover:bg-white/10"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg p-2 transition-all duration-200 ${viewMode === "list" ? "toggle-active scale-110" : "text-muted-foreground hover:bg-white/10"}`}
                  aria-label="List view"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
              
              <div className="relative flex items-center gap-3">
                <span className="text-sm font-bold text-white/40 uppercase tracking-widest">Sort by</span>
                <div className="relative group">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as "recent" | "oldest")}
                    className="appearance-none rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-2.5 text-sm text-white transition-all hover:bg-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  >
                    <option value="recent" className="bg-[#0a0a0a] text-white">Most recent</option>
                    <option value="oldest" className="bg-[#0a0a0a] text-white">Oldest first</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              No jobs found in this category.
            </div>
          ) : (
            <div
              className={`grid gap-6 ${viewMode === "list" ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"}`}
            >
              {sortedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isEmployer={isEmployer}
                  isJobSeeker={isJobSeeker}
                  session={session}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({
  job,
  isEmployer,
  session,
}: {
  job: JobItem;
  isEmployer: boolean;
  isJobSeeker: boolean;
  session: Session | null;
}) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-slate-200 hover:shadow-md hover:border-slate-300 group flex flex-col p-6 rounded-2xl transition-all shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            companyName={job.companyName || job.employer.companyName}
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
          {job.companyName || job.employer.companyName}
        </p>
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-[#2563eb]/70" />
          {formatLocation(job.location, true)}
        </p>
      </div>
      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Posted {formatDate(job.createdAt)}
        </p>
        <div className="w-1/2">
          {isEmployer ? (
            <Link href={`/jobs/${job.id}`} className="w-full">
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
                <span style={{ color: "white" }}>Apply Now</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
