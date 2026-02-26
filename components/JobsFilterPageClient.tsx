"use client";

import { useSession } from "next-auth/react";
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
  employer: { companyName: string; companyLogo?: string | null };
};

const EMPLOYMENT_BADGE_COLORS: Record<string, string> = {
  FULL_TIME: "bg-emerald-100 text-emerald-800",
  PART_TIME: "bg-teal-100 text-teal-800",
  CONTRACT: "bg-amber-100 text-amber-800",
  FREELANCE: "bg-violet-100 text-violet-800",
  INTERNSHIP: "bg-sky-100 text-sky-800",
  REMOTE: "bg-blue-100 text-blue-800",
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
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
          Loading jobs...
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{total} Jobs Found</span>
              <span className="ml-2 text-sm">
                Showing {start} - {end} of {total} results
              </span>
            </p>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-2 ${viewMode === "grid" ? "bg-[#2563eb] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-2 ${viewMode === "list" ? "bg-[#2563eb] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  aria-label="List view"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "recent" | "oldest")}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  <option value="recent">Most recent</option>
                  <option value="oldest">Oldest first</option>
                </select>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-600 shadow-sm">
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
  session: unknown;
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
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getEmploymentBadgeClass(job.employmentType)}`}
        >
          {job.employmentType.replace("_", " ")}
        </span>
        <div className="flex items-center gap-1">
          <ShareJobButton jobId={job.id} jobTitle={job.title} className="h-8 w-8" />
          <CompanyLogo
          companyLogo={job.employer.companyLogo}
          companyName={job.employer.companyName}
          size="md"
          className="rounded-lg"
        />
        </div>
      </div>
      <Link
        href={`/jobs/${job.id}`}
        className="mt-3 block text-lg font-bold text-gray-900 hover:text-[#2563eb]"
      >
        {job.title}
      </Link>
      {job.salaryRange && (
        <p className="mt-1 text-sm text-gray-600">Salary: {job.salaryRange}</p>
      )}
      <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
        {job.employer.companyName}
        <span className="inline-flex items-center text-[#2563eb]">
          <MapPin className="h-3.5 w-3.5" />
          {formatLocation(job.location)}
        </span>
      </p>
      <p className="mt-2 text-xs text-gray-400">Posted on {formatDate(job.createdAt)}</p>
      <div className="mt-4">
        {isEmployer ? (
          <Link href={`/jobs/${job.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-full border-sky-200 bg-sky-50/50 text-[#2563eb] hover:bg-sky-100"
            >
              View Details
            </Button>
          </Link>
        ) : (
          <Link
            href={
              session
                ? `/jobs/${job.id}`
                : `/login?callbackUrl=${encodeURIComponent(`/jobs/${job.id}`)}`
            }
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-full border-sky-200 bg-sky-50/50 text-[#2563eb] hover:bg-sky-100"
            >
              Apply Now
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
