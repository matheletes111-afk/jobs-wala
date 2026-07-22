"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatLocation, formatSalary } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import JobStatusActions from "@/components/employer/JobStatusActions";
import { Search, Briefcase, MapPin, Calendar, Plus, LayoutGrid, List, FileText, Pencil, Download } from "lucide-react";
import ShareJobButton from "@/components/ShareJobButton";
import CompanyLogo from "@/components/CompanyLogo";

interface EmployerJob {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  payType?: string | null;
  status: string;
  experienceMin?: number | null;
  experienceMax?: number | null;
  employmentType?: string;
  workMode?: string;
  requiredSkills?: string[];
  createdAt?: string;
  expiresAt?: string | null;
  companyName?: string | null;
  employer?: { companyName: string; companyLogo?: string | null };
  _count: { applications: number };
}

interface CategoryOption {
  id: string;
  name: string;
  status: string;
}

interface FetchResult {
  jobs: EmployerJob[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export default function EmployerJobListClient() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("desc");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedSort, setAppliedSort] = useState("desc");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const limit = 12;

  const fetchJobs = useCallback(
    async (
      pageNum: number,
      searchVal: string,
      categoryVal: string,
      locationVal: string,
      sortVal: string
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(limit));
        params.set("sort", sortVal);
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (categoryVal && categoryVal !== "all")
          params.set("category", categoryVal);
        if (locationVal.trim())
          params.set("location", encodeURIComponent(locationVal.trim()));
        const res = await fetch(`/api/employer/jobs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: FetchResult = await res.json();
        setJobs(data.jobs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
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

  const [isRestored, setIsRestored] = useState(false);

  // Load saved filters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("employer_jobs_filters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSearch(parsed.search || "");
          setCategory(parsed.category || "all");
          setLocation(parsed.location || "");
          setSort(parsed.sort || "desc");

          setAppliedSearch(parsed.appliedSearch || "");
          setAppliedCategory(parsed.appliedCategory || "all");
          setAppliedLocation(parsed.appliedLocation || "");
          setAppliedSort(parsed.appliedSort || "desc");

          setPage(parsed.page || 1);
          if (parsed.viewMode) setViewMode(parsed.viewMode);
        } catch (e) {
          // ignore
        }
      }
    }
    setIsRestored(true);
  }, []);

  // Save filters to sessionStorage when they change
  useEffect(() => {
    if (!isRestored) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "employer_jobs_filters",
        JSON.stringify({
          search,
          category,
          location,
          sort,
          appliedSearch,
          appliedCategory,
          appliedLocation,
          appliedSort,
          page,
          viewMode,
        })
      );
    }
  }, [search, category, location, sort, appliedSearch, appliedCategory, appliedLocation, appliedSort, page, viewMode, isRestored]);

  useEffect(() => {
    fetchJobs(page, appliedSearch, appliedCategory, appliedLocation, appliedSort);
  }, [page, appliedSearch, appliedCategory, appliedLocation, appliedSort, fetchJobs]);

  const handleSearch = () => {
    setAppliedSearch(search);
    setAppliedCategory(category);
    setAppliedLocation(location);
    setAppliedSort(sort);
    setPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setCategory("all");
    setLocation("");
    setSort("desc");
    setAppliedSearch("");
    setAppliedCategory("all");
    setAppliedLocation("");
    setAppliedSort("desc");
    setPage(1);
  };

  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async (applyFilters: boolean) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("export", "true");
      if (applyFilters) {
        if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
        if (appliedCategory && appliedCategory !== "all") params.set("category", appliedCategory);
        if (appliedLocation.trim()) params.set("location", appliedLocation.trim());
        params.set("sort", appliedSort);
      }
      
      const res = await fetch(`/api/employer/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch jobs for export");
      const data = await res.json();
      const exportJobs = data.jobs ?? [];
      
      if (exportJobs.length === 0) {
        alert("No jobs found to export.");
        return;
      }
      
      const headers = [
        "ID", "Title", "Status", "Category", "Location", "Applications", 
        "Min Salary", "Max Salary", "Currency", "Per Type", 
        "Min Experience", "Max Experience", "Employment Type", "Work Mode", 
        "Required Skills", "Created At", "Expires At"
      ];
      const rows = exportJobs.map((job: any) => [
        job.id,
        `"${job.title.replace(/"/g, '""')}"`,
        job.status,
        `"${job.category}"`,
        `"${formatLocation(job.location, true)}"`,
        job._count?.applications ?? 0,
        job.salaryMin ?? "",
        job.salaryMax ?? "",
        job.currency ?? "",
        job.payType ?? "",
        job.experienceMin ?? "",
        job.experienceMax ?? "",
        job.employmentType ?? "",
        job.workMode ?? "",
        `"${(job.requiredSkills || []).join(", ").replace(/"/g, '""')}"`,
        job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : "",
        job.expiresAt ? new Date(job.expiresAt).toISOString().split('T')[0] : ""
      ]);
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
        + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${applyFilters ? "filtered_" : "all_"}jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Failed to export jobs.");
    } finally {
      setExporting(false);
    }
  };

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const containerClass =
    "mx-auto w-full max-w-[1300px] min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10";

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground">
      <div className={containerClass}>
        {/* Welcome Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/60 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">Job Management</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Your Jobs</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Monitor and manage your active and past job opportunities.</p>
          </div>
          <Link href="/employer/jobs/new">
            <Button className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 transition-all flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 animate-in spin-in-12 duration-500" style={{ color: "white" }} />
              <span style={{ color: "white" }}>Post a Job</span>
            </Button>
          </Link>
        </div>

        {/* Clean Flat Filters Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by job title or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-11 pl-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white text-xs font-medium text-slate-700"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 text-xs font-semibold text-slate-600">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg">
                <SelectItem value="all" className="text-xs font-semibold">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name} className="text-xs font-semibold">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 text-xs font-semibold text-slate-600">
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg">
                <SelectItem value="desc" className="text-xs font-semibold">Latest First</SelectItem>
                <SelectItem value="asc" className="text-xs font-semibold">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
            <div className="w-full [&_button]:h-11 [&_button]:rounded-xl">
              <LocationDropdown value={location} onChange={setLocation} />
            </div>
            <div className="flex items-center justify-end gap-2 w-full pt-4 border-t border-slate-100">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 w-full md:w-auto"
              >
                <span style={{ color: "white" }}>Search</span>
              </Button>
              <Button
                variant="ghost"
                onClick={handleClear}
                disabled={loading}
                className="h-11 px-5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 w-full md:w-auto"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* List Sub-Header Toggles */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{total} Job{total !== 1 && "s"} Found</span>
          </div>
          {!loading && jobs.length > 0 && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCSV(true)}
                disabled={exporting}
                className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export Filtered"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCSV(false)}
                disabled={exporting}
                className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export All"}
              </Button>
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={`h-9 w-9 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:bg-slate-200"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("table")}
                  className={`h-9 w-9 rounded-lg transition-all ${viewMode === "table" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:bg-slate-200"}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 w-full animate-in fade-in duration-700">
          <div className="w-full">
            {loading ? (
              <div className="rounded-2xl p-24 text-center border border-slate-200 bg-white shadow-sm animate-pulse">
                <p className="text-sm font-semibold text-slate-400 italic">Loading Jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl p-24 text-center border border-slate-200 bg-white shadow-sm">
                <p className="text-sm font-semibold text-slate-400">No matching jobs found.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                {jobs.map((job, idx) => (
                  <div
                    key={job.id}
                    className="bg-white border border-slate-200 group flex flex-col overflow-hidden rounded-2xl shadow-sm p-5 transition-all hover:shadow-md hover:border-blue-400/50 animate-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <CompanyLogo
                          companyLogo={job.employer?.companyLogo}
                          companyName={job.companyName || job.employer?.companyName || job.title}
                          size="md"
                          className="h-12 w-12 shrink-0 rounded-xl bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${job.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"}`} />
                            <span className={`text-xs font-semibold ${job.status === "ACTIVE" ? "text-emerald-600" : "text-slate-500"}`}>
                              {job.status}
                            </span>
                          </div>
                          <Link href={`/employer/jobs/${job.id}`}>
                            <h3 className="text-base font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                              {job.title}
                            </h3>
                          </Link>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {job.companyName || job.employer?.companyName}
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <MapPin className="h-3 w-3 text-blue-500" />
                            {formatLocation(job.location, true)}
                          </p>
                        </div>
                      </div>
                      <Link href={`/employer/jobs/${job.id}/edit`} className="shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-100 text-blue-600 rounded-lg transition-all"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
                        {job.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
                        {job.status === "PAUSED" ? "Paused" : job.status === "CLOSED" ? "Closed" : job.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ""}
                      </span>
                      {formatSalary(job) && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-600">
                          {formatSalary(job)}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                      <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        {job._count.applications} Applications Received
                      </span>
                      <div className="flex items-center gap-2">
                        <ShareJobButton
                          jobId={job.id}
                          jobTitle={job.title}
                          className="h-9 w-9 bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg"
                        />
                        <div className="h-9 px-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center">
                          <JobStatusActions
                            jobId={job.id}
                            jobTitle={job.title}
                            currentStatus={job.status}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Link href={`/employer/jobs/${job.id}`} className="w-full">
                        <Button
                          variant="default"
                          className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/10"
                        >
                          Manage Job Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-700">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Code</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Title</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">State</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Status</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Salary (Min - Max)</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Recruiter</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Created (Date)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jobs.map((job) => {
                        const jobCode = `#JOB-${job.id.substring(0, 6).toUpperCase()}`;
                        const clientName = job.companyName || job.employer?.companyName || "JobDaddy Partner";
                        let locationCity = "N/A";
                        let locationState = "N/A";
                        try {
                            const parsed = JSON.parse(job.location);
                            if (parsed.city && Array.isArray(parsed.city) && parsed.city.length > 0) {
                              locationCity = parsed.city[0];
                            } else if (parsed.city && typeof parsed.city === "string") {
                              locationCity = parsed.city;
                            } else if (parsed.country) {
                              locationCity = parsed.country;
                            }
                            
                            if (parsed.state && Array.isArray(parsed.state) && parsed.state.length > 0) {
                              locationState = parsed.state[0];
                            } else if (parsed.state && typeof parsed.state === "string") {
                              locationState = parsed.state;
                            } else {
                              locationState = parsed.country || "India";
                            }
                        } catch {
                          const locParts = job.location.split(",");
                          locationCity = locParts[0]?.trim() || job.location;
                          locationState = locParts[1]?.trim() || "India";
                        }
                        const salaryRange = job.salaryMin && job.salaryMax 
                          ? `${job.currency || "₹"}${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                          : "Not Disclosed";
                        const primaryRecruiter = "Tarun Upadhyay";
                        const createdDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-";

                        return (
                          <tr key={job.id} className="bg-transparent hover:bg-slate-50/30 transition-colors">
                            <td colSpan={9} className="p-0 pb-4 bg-transparent">
                              <div className="flex flex-col w-full bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400/50 transition-all duration-300 overflow-hidden">
                                {/* Main Row Information - Changed py-10 to py-5 for compact size */}
                                <div className="grid grid-cols-9 w-full items-center py-5 px-6 text-left bg-white">
                                  <div className="font-bold text-xs text-blue-600">{jobCode}</div>
                                  <div className="col-span-1 pr-4">
                                    <Link href={`/employer/jobs/${job.id}`}>
                                      <p className="font-bold text-sm text-slate-800 hover:text-blue-600 transition-colors line-clamp-1">{job.title}</p>
                                    </Link>
                                  </div>
                                  <div className="text-xs font-semibold text-slate-700 truncate pr-4">{clientName}</div>
                                  <div className="text-xs font-semibold text-slate-600 truncate pr-4">{locationCity}</div>
                                  <div className="text-xs font-semibold text-slate-500 truncate pr-4">{locationState}</div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`h-1.5 w-1.5 rounded-full ${job.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"}`} />
                                      <span className={`text-xs font-semibold ${job.status === "ACTIVE" ? "text-emerald-600" : "text-slate-500"}`}>
                                        {job.status}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs font-semibold text-slate-700 truncate pr-4">{salaryRange}</div>
                                  <div className="text-xs font-semibold text-slate-600 truncate pr-4">{primaryRecruiter}</div>
                                  <div className="text-xs font-semibold text-slate-500">{createdDate}</div>
                                </div>

                                {/* Action Row Below */}
                                <div className="border-t border-slate-100 bg-slate-50/50 py-3.5 px-6 flex items-center justify-between">
                                  <div className="text-[11px] font-semibold text-slate-400">
                                    Monitor & update candidate pipelines or update status
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <ShareJobButton jobId={job.id} jobTitle={job.title} className="h-9 w-9 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all shadow-sm" />
                                    <div className="h-9 px-2 rounded-xl bg-white border border-slate-200 flex items-center shadow-sm">
                                      <JobStatusActions
                                        jobId={job.id}
                                        jobTitle={job.title}
                                        currentStatus={job.status}
                                      />
                                    </div>
                                    <Link href={`/employer/jobs/${job.id}/edit`}>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs gap-1.5 transition-all shadow-sm"
                                      >
                                        <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                        Edit
                                      </Button>
                                    </Link>
                                    <Link href={`/employer/jobs/${job.id}`}>
                                      <Button variant="default" size="sm" className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/10">
                                        <span style={{ color: "white" }}>Manage Details</span>
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-10 px-6 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                >
                  Previous Page
                </Button>
                <span className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-500 shadow-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-10 px-6 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                >
                  Next Page
                </Button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      );
}
