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
        <section className="bg-gray-50/60 py-12">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm font-medium text-[#22c55e]">
              Here You Can See
            </p>
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Top Companies are Hiring
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {topCompanies.map((c) => (
                <Link
                  key={c.userId}
                  href={`/jobs/company/${c.userId}`}
                  className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md hover:border-[#2563eb]/50"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-sky-100 text-xl font-bold text-[#2563eb]">
                    {c.companyLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.companyLogo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (c.companyName[0] ?? "?").toUpperCase()
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">{c.companyName}</p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#22c55e]" />
                    {c.location}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-[#f97316]">
                    <Briefcase className="h-4 w-4" />
                    {c.openJobsCount} Open Job{c.openJobsCount !== 1 ? "s" : ""}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                className="border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb]/5"
                asChild
              >
                <Link href="/user/jobs">View All Featured Companies</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Browse Jobs By Categories - horizontal scroll */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <p className="text-center text-sm font-medium text-[#22c55e]">
            Find Your Path
          </p>
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Browse Jobs By Categories
          </h2>
          <div className="relative flex justify-center">
            <button
              type="button"
              onClick={() => scrollCategories("left")}
              className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => scrollCategories("right")}
              className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            <div
              ref={categoryScrollRef}
              className="flex justify-center gap-4 overflow-x-auto pb-2 scroll-smooth scrollbar-thin"
              style={{ scrollbarWidth: "thin" }}
            >
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/jobs/category/${encodeURIComponent(cat.name)}`}
                  className="flex min-w-[200px] flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#2563eb]/50"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <LayoutGrid className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-gray-900">{cat.name}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-[#f97316]">
                    <Briefcase className="h-4 w-4" />
                    ({cat.jobCount}) Jobs
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Jobs - card grid */}
      <section className="bg-gray-50/60 py-12">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium text-[#22c55e]">
            Here You Can See
          </p>
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Latest Jobs
          </h2>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-600 shadow-sm">
              No jobs available right now. Check back later.
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getEmploymentBadgeClass(
                          job.employmentType
                        )}`}
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
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                      {job.employer.companyName}
                      <span className="inline-flex items-center text-[#2563eb]">
                        <MapPin className="h-3.5 w-3.5" />
                        {formatLocation(job.location)}
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      Posted on {formatDate(job.createdAt)}
                    </p>
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
                        <Link href={session ? `/jobs/${job.id}` : `/login?callbackUrl=${encodeURIComponent(`/jobs/${job.id}`)}`}>
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
                ))}
              </div>
              <div className="mt-10 flex justify-center">
                <Button
                  className="rounded-full bg-[#2563eb] px-8 text-white hover:bg-[#1d4ed8]"
                  asChild
                >
                  <Link href="/user/jobs">View All Latest Jobs</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}