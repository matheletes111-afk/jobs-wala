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
import {
  Search,
  LayoutGrid,
  List,
  ChevronRight,
  Briefcase,
  MapPin,
  Calendar,
  Download,
  ChevronDown,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatLocation, stripHtml } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import JobApprovalActions from "@/components/admin/JobApprovalActions";
import ShareJobButton from "@/components/ShareJobButton";
import CompanyLogo from "@/components/CompanyLogo";
import Pagination from "@/components/common/Pagination";

interface Category {
  id: string;
  name: string;
}

interface JobItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  companyName: string | null;
  location: string;
  category: string;
  employer: {
    companyName: string;
    companyLogo: string | null;
    description: string | null;
    industry: string | null;
  };
  _count: {
    applications: number;
  };
}

interface FetchResult {
  jobs: JobItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

interface AdminJobsClientProps {
  initialCategories?: Category[];
}

export default function AdminJobsClient({ initialCategories }: AdminJobsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("desc");

  // Applied Filters State
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const [appliedSort, setAppliedSort] = useState("desc");

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [exporting, setExporting] = useState(false);

  const categories = initialCategories ?? [];
  const limit = 12;

  const updateUrl = useCallback(
    (
      pageNum: number,
      searchVal: string,
      locationVal: string,
      categoryVal: string,
      statusVal: string,
      sortVal: string
    ) => {
      const params = new URLSearchParams();
      if (pageNum > 1) params.set("page", String(pageNum));
      if (searchVal.trim()) params.set("search", searchVal.trim());
      if (locationVal.trim()) params.set("location", locationVal.trim());
      if (categoryVal && categoryVal !== "all") params.set("category", categoryVal);
      if (statusVal && statusVal !== "all") params.set("status", statusVal);
      if (sortVal && sortVal !== "desc") params.set("sort", sortVal);
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  const getJobDetailUrl = (jobId: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
    if (appliedLocation.trim()) params.set("location", appliedLocation.trim());
    if (appliedCategory && appliedCategory !== "all") params.set("category", appliedCategory);
    if (appliedStatus && appliedStatus !== "all") params.set("status", appliedStatus);
    if (appliedSort && appliedSort !== "desc") params.set("sort", appliedSort);
    const query = params.toString();
    return `/admin/jobs/${jobId}${query ? `?${query}` : ""}`;
  };

  const fetchJobs = useCallback(
    async (
      pageNum: number,
      searchVal: string,
      locationVal: string,
      categoryVal: string,
      statusVal: string,
      sortVal: string
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(limit));
        params.set("sort", sortVal);
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (locationVal.trim()) params.set("location", locationVal.trim());
        if (categoryVal && categoryVal !== "all") params.set("category", categoryVal);
        if (statusVal && statusVal !== "all") params.set("status", statusVal);

        const res = await fetch(`/api/admin/jobs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data: FetchResult = await res.json();
        setJobs(data.jobs ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? pageNum);
      } catch (error) {
        setJobs([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  // Sync state with searchParams (URL) and sessionStorage
  useEffect(() => {
    let searchVal = searchParams.get("search");
    let locationVal = searchParams.get("location");
    let categoryVal = searchParams.get("category");
    let statusVal = searchParams.get("status");
    let sortVal = searchParams.get("sort");
    let pageValStr = searchParams.get("page");

    const hasParams =
      searchVal !== null ||
      locationVal !== null ||
      categoryVal !== null ||
      statusVal !== null ||
      sortVal !== null ||
      pageValStr !== null;

    if (!hasParams && typeof window !== "undefined") {
      const saved = sessionStorage.getItem("admin_jobs_filters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          searchVal = parsed.search || "";
          locationVal = parsed.location || "";
          categoryVal = parsed.category || "all";
          statusVal = parsed.status || "all";
          sortVal = parsed.sort || "desc";
          pageValStr = parsed.page ? String(parsed.page) : "1";

          const params = new URLSearchParams();
          if (pageValStr && pageValStr !== "1") params.set("page", pageValStr);
          if (searchVal?.trim()) params.set("search", searchVal.trim());
          if (locationVal?.trim()) params.set("location", locationVal.trim());
          if (categoryVal && categoryVal !== "all") params.set("category", categoryVal);
          if (statusVal && statusVal !== "all") params.set("status", statusVal);
          if (sortVal && sortVal !== "desc") params.set("sort", sortVal);
          const query = params.toString();
          router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
        } catch (_e) {}
      }
    }

    const finalSearch = searchVal || "";
    const finalLocation = locationVal || "";
    const finalCategory = categoryVal || "all";
    const finalStatus = statusVal || "all";
    const finalSort = sortVal || "desc";
    const finalPage = parseInt(pageValStr || "1", 10);

    setSearch(finalSearch);
    setLocation(finalLocation);
    setCategory(finalCategory);
    setStatus(finalStatus);
    setSort(finalSort);
    setPage(finalPage);

    setAppliedSearch(finalSearch);
    setAppliedLocation(finalLocation);
    setAppliedCategory(finalCategory);
    setAppliedStatus(finalStatus);
    setAppliedSort(finalSort);

    const isClean =
      !finalSearch &&
      !finalLocation &&
      finalCategory === "all" &&
      finalStatus === "all" &&
      finalSort === "desc" &&
      finalPage === 1;

    if (typeof window !== "undefined") {
      if (isClean) {
        try {
          sessionStorage.removeItem("admin_jobs_filters");
        } catch (_e) {}
      } else {
        try {
          sessionStorage.setItem(
            "admin_jobs_filters",
            JSON.stringify({
              search: finalSearch,
              location: finalLocation,
              category: finalCategory,
              status: finalStatus,
              sort: finalSort,
              appliedSearch: finalSearch,
              appliedLocation: finalLocation,
              appliedCategory: finalCategory,
              appliedStatus: finalStatus,
              appliedSort: finalSort,
              page: finalPage,
            })
          );
        } catch (_e) {}
      }
    }
  }, [searchParams, pathname, router]);

  useEffect(() => {
    fetchJobs(
      page,
      appliedSearch,
      appliedLocation,
      appliedCategory,
      appliedStatus,
      appliedSort
    );
  }, [
    page,
    appliedSearch,
    appliedLocation,
    appliedCategory,
    appliedStatus,
    appliedSort,
    fetchJobs,
  ]);

  const handleSearch = () => {
    updateUrl(1, search, location, category, status, sort);
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("admin_jobs_filters");
      } catch (_e) {}
    }

    setSearch("");
    setLocation("");
    setCategory("all");
    setStatus("all");
    setSort("desc");

    setAppliedSearch("");
    setAppliedLocation("");
    setAppliedCategory("all");
    setAppliedStatus("all");
    setAppliedSort("desc");
    setPage(1);

    router.replace(pathname, { scroll: false });
    fetchJobs(1, "", "", "all", "all", "desc");
  };

  const handleJobUpdated = () => {
    fetchJobs(page, appliedSearch, appliedLocation, appliedCategory, appliedStatus, appliedSort);
  };

  const handleExportCSV = async (applyFilters: boolean) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("export", "true");
      if (applyFilters) {
        if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
        if (appliedLocation.trim()) params.set("location", appliedLocation.trim());
        if (appliedCategory && appliedCategory !== "all") params.set("category", appliedCategory);
        if (appliedStatus && appliedStatus !== "all") params.set("status", appliedStatus);
      }

      const res = await fetch(`/api/admin/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      const exportJobs: JobItem[] = data.jobs ?? [];

      if (exportJobs.length === 0) {
        alert("No jobs found to export.");
        return;
      }

      const headers = [
        "Job ID", "Job Title", "Company Name", "Industry", "Location", "Category", "Status", "Applications Count", "Created At"
      ];
      const rows = exportJobs.map(job => [
        job.id,
        `"${job.title.replace(/"/g, '""')}"`,
        `"${(job.companyName || job.employer.companyName).replace(/"/g, '""')}"`,
        `"${(job.employer.industry || "General Exploration").replace(/"/g, '""')}"`,
        `"${formatLocation(job.location, true).replace(/"/g, '""')}"`,
        `"${job.category}"`,
        job.status,
        job._count.applications,
        job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : ""
      ]);

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
        + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const filename = applyFilters ? `jobs_filtered_${new Date().toISOString().split('T')[0]}.csv` : `jobs_all_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export jobs.");
    } finally {
      setExporting(false);
    }
  };

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const containerClass = "mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10";

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      <div className={containerClass}>
        {/* Header */}
        <div className="mb-8 border-b border-slate-200/60 pb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Job Management</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Job <span className="text-blue-600">Administration</span>
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Monitor, approve, and manage job listings across the platform.
          </p>
        </div>

        {/* Clean Flat Top Filters Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search job titles or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-11 pl-11 bg-slate-50/50 border-slate-200 focus:bg-white text-xs font-medium text-slate-700"
              />
            </div>
            <div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Country, State, City selectors via LocationDropdown */}
          <div className="grid grid-cols-1 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Location Filter (Country / State / City)
              </label>
              <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200">
                <LocationDropdown value={location} onChange={setLocation} />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              onClick={handleSearch}
              loading={loading}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 w-full md:w-auto"
            >
              <span style={{ color: "white" }}>Search Jobs</span>
            </Button>
            <Button
              variant="ghost"
              onClick={handleClear}
              loading={loading}
              className="h-11 px-5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 w-full md:w-auto"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Result Grid Section */}
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-200/60 pb-6">
            <div className="flex flex-col gap-1">
              <p className="text-2xl font-bold text-slate-800 tracking-tight tabular-nums">
                {total} <span className="text-xs font-semibold text-blue-600 ml-2">Jobs Found</span>
              </p>
              <p className="text-xs font-semibold text-slate-400">
                Showing {start} - {end} jobs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={exporting}
                onClick={() => handleExportCSV(true)}
                className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 disabled:opacity-50 shadow-sm"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export Filtered"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={exporting}
                onClick={() => handleExportCSV(false)}
                className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border border-slate-200 hover:bg-slate-55 transition-colors text-slate-700 disabled:opacity-50 shadow-sm"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export All"}
              </Button>
              <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-250/60">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg p-2 transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                  aria-label="Grid Mode"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg p-2 transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                  aria-label="List Mode"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <div className="relative group">
                <div className="flex items-center gap-3 h-10 px-4 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
                  <span className="text-slate-400">SORT:</span> {sort === "recent" ? "LATEST" : "OLDEST"}
                  <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                </div>
                <select
                  value={sort}
                  onChange={(e) => updateUrl(1, appliedSearch, appliedLocation, appliedCategory, appliedStatus, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  <option value="desc">LATEST</option>
                  <option value="asc">OLDEST</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center animate-pulse shadow-sm">
              <p className="text-xs font-semibold text-blue-500">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center">
              <p className="text-xs font-semibold text-slate-400 italic">
                No jobs found matching your criteria.
              </p>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${viewMode === "list" ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-2"}`}
            >
              {jobs.map((job, idx) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onUpdated={handleJobUpdated}
                  index={idx}
                  getJobDetailUrl={getJobDetailUrl}
                />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => updateUrl(p, appliedSearch, appliedLocation, appliedCategory, appliedStatus, appliedSort)}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

function JobCard({
  job,
  onUpdated,
  index,
  getJobDetailUrl,
}: {
  job: JobItem;
  onUpdated: () => void;
  index: number;
  getJobDetailUrl: (jobId: string) => string;
}) {
  const statusLabel =
    job.status === "PAUSED"
      ? "SUBSIDED"
      : job.status === "CLOSED"
        ? "TERMINATED"
        : job.status;

  return (
    <div
      className="group bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all duration-300"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <CompanyLogo
            companyLogo={job.employer.companyLogo}
            companyName={job.companyName || job.employer.companyName}
            size="lg"
            className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 shadow-sm transition-transform group-hover:scale-105"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`inline-flex h-1.5 w-1.5 rounded-full ${job.status === "ACTIVE" ? "bg-blue-500" : job.status === "PENDING" ? "bg-orange-500" : "bg-red-500"}`} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{job.status === "ACTIVE" ? "ACTIVE JOB" : "PENDING REVIEW"}</p>
            </div>
            <Link href={getJobDetailUrl(job.id)}>
              <h3 className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors truncate">{job.title}</h3>
            </Link>
            <p className="text-xs font-semibold text-slate-400 mt-0.5 truncate">
              {job.companyName || job.employer.companyName} {" // "} {job.employer.industry || "General Exploration"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs leading-relaxed text-slate-500 font-medium line-clamp-2">
            {job.employer.description ? stripHtml(job.employer.description) : "No description uploaded yet."}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[10px] font-semibold text-blue-600">
            {job.category}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-slate-400" />
            {formatLocation(job.location, true)}
          </span>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-150/60">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-slate-350" />
              {job._count.applications} Applicants
            </span>
            {job.createdAt && (
              <>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-350" />
                  {new Date(job.createdAt).toLocaleDateString("en-GB")}
                </span>
              </>
            )}
          </div>

          <span
            className={`rounded-lg px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${job.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : job.status === "PENDING"
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <ShareJobButton jobId={job.id} jobTitle={job.title} className="h-9 w-9 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors shrink-0 flex items-center justify-center" />
          <div className="[&_button]:h-9 [&_button]:rounded-xl [&_button]:text-xs [&_button]:font-semibold">
            <JobApprovalActions
              jobId={job.id}
              currentStatus={
                job.status as "PENDING" | "ACTIVE" | "INACTIVE" | "PAUSED" | "CLOSED"
              }
              onSuccess={onUpdated}
            />
          </div>
          <Link href={getJobDetailUrl(job.id)}>
            <Button variant="ghost" className="h-9 px-4 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all active:scale-95 group">
              View Job
              <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
