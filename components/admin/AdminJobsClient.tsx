"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatLocation } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import JobApprovalActions from "@/components/admin/JobApprovalActions";
import {
  Search,
  MapPin,
  LayoutGrid,
  List,
  ChevronDown,
  Briefcase,
  Calendar,
} from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import ShareJobButton from "@/components/ShareJobButton";

interface JobItem {
  id: string;
  title: string;
  location: string;
  category: string;
  status: string;
  createdAt?: string;
  employer: {
    companyName: string;
    companyLogo?: string | null;
    industry?: string | null;
    companySize?: string | null;
    description?: string | null;
  };
  _count: { applications: number };
}

interface CategoryOption {
  id: string;
  name: string;
  status: string;
}

interface FetchResult {
  jobs: JobItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export default function AdminJobsClient() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const limit = 12;

  const fetchJobs = useCallback(
    async (
      pageNum: number,
      searchVal: string,
      categoryVal: string,
      locationVal: string,
      statusVal: string
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(limit));
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (categoryVal && categoryVal !== "all")
          params.set("category", categoryVal);
        if (locationVal.trim())
          params.set("location", encodeURIComponent(locationVal.trim()));
        if (statusVal && statusVal !== "all") params.set("status", statusVal);
        const res = await fetch(`/api/admin/jobs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: FetchResult = await res.json();
        setJobs(data.jobs ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? 1);
      } catch {
        setJobs([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetch("/api/categories?activeOnly=true")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    fetchJobs(
      page,
      appliedSearch,
      appliedCategory,
      appliedLocation,
      appliedStatus
    );
  }, [
    page,
    appliedSearch,
    appliedCategory,
    appliedLocation,
    appliedStatus,
    fetchJobs,
  ]);

  const handleSearch = () => {
    setAppliedSearch(search);
    setAppliedCategory(category);
    setAppliedLocation(location);
    setAppliedStatus(status);
    setPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setCategory("all");
    setLocation("");
    setStatus("all");
    setAppliedSearch("");
    setAppliedCategory("all");
    setAppliedLocation("");
    setAppliedStatus("all");
    setPage(1);
  };

  const handleJobUpdated = useCallback(() => {
    fetchJobs(
      page,
      appliedSearch,
      appliedCategory,
      appliedLocation,
      appliedStatus
    );
  }, [
    page,
    appliedSearch,
    appliedCategory,
    appliedLocation,
    appliedStatus,
    fetchJobs,
  ]);

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const containerClass =
    "mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10";

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50/50">
      <div className={containerClass}>
        {/* Hero / Search Section */}
        <div className="rounded-b-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 px-6 pb-8 pt-6 md:px-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
          Explore Job Postings
        </p>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
          Find jobs that need approval
        </h1>
        <p className="mb-6 text-gray-600">
          Browse job postings, filter by category and status, and approve or manage listings.
        </p>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="relative flex-1 min-w-[180px]">
            <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Job title or keyword"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <div className="w-[180px]">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="bg-[#2563eb] hover:bg-[#1d4ed8]"
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={loading}
            className="border-gray-300"
          >
            Clear filters
          </Button>
        </div>
        </div>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        {/* Left Filter Panel */}
        <aside className="w-full shrink-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:w-72">
          <h2 className="mb-4 font-semibold text-gray-900">Search jobs</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Job title or keyword
              </label>
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Location</label>
              <LocationDropdown value={location} onChange={setLocation} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSearch}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]"
            >
              Apply filters
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={loading}
              className="w-full border-gray-300"
            >
              Clear filters
            </Button>
          </div>
        </aside>

        {/* Right Content */}
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{total} Jobs Found</span>
              <span className="ml-2 text-sm">
                Showing {start} - {end} verified postings
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
              <span className="text-sm text-gray-600">Sort by</span>
              <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900">
                <option>Most relevant</option>
              </select>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
              No jobs match your filters. Try adjusting search or clear filters.
            </div>
          ) : (
            <div
              className={`grid gap-6 ${viewMode === "list" ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-3"}`}
            >
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onUpdated={handleJobUpdated}
                />
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function JobCard({
  job,
  onUpdated,
}: {
  job: JobItem;
  onUpdated: () => void;
}) {
  const statusLabel =
    job.status === "PAUSED"
      ? "Paused"
      : job.status === "CLOSED"
        ? "Closed"
        : job.status;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex min-w-0 items-start gap-4">
        <CompanyLogo
          companyLogo={job.employer.companyLogo}
          companyName={job.employer.companyName}
          size="lg"
          className="h-14 w-14 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {job.status === "ACTIVE" && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                VERIFIED
              </span>
            )}
            <h3 className="font-semibold text-gray-900">{job.title}</h3>
          </div>
          <p className="text-sm text-gray-500">
            {job.employer.companyName}
            {job.employer.industry && ` • ${job.employer.industry}`}
            {job.employer.companySize && ` • ${job.employer.companySize}`}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-3.5 w-3.5" />
            {formatLocation(job.location)}
          </p>
        </div>
      </div>

      {job.employer.description && (
        <p className="mt-3 line-clamp-2 text-sm text-gray-600">
          {job.employer.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#2563eb]">
          {job.category}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            job.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700"
              : job.status === "PENDING"
                ? "bg-amber-50 text-amber-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            {job._count.applications} applications
          </span>
          {job.createdAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(job.createdAt).getFullYear()}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ShareJobButton jobId={job.id} jobTitle={job.title} className="h-8 w-8" />
          <JobApprovalActions
            jobId={job.id}
            currentStatus={
              job.status as "PENDING" | "ACTIVE" | "INACTIVE" | "PAUSED" | "CLOSED"
            }
            onSuccess={onUpdated}
          />
          <Link href={`/admin/jobs/${job.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-[#2563eb] text-[#2563eb] hover:bg-blue-50"
            >
              View details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
