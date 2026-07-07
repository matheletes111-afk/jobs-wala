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

  const handleExportCSV = () => {
    if (jobs.length === 0) return;
    const headers = [
      "ID", "Title", "Status", "Category", "Location", "Applications", 
      "Min Salary", "Max Salary", "Currency", "Per Type", 
      "Min Experience", "Max Experience", "Employment Type", "Work Mode", 
      "Required Skills", "Created At", "Expires At"
    ];
    const rows = jobs.map(job => [
      job.id,
      `"${job.title.replace(/"/g, '""')}"`,
      job.status,
      `"${job.category}"`,
      `"${formatLocation(job.location, true)}"`,
      job._count.applications,
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
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const containerClass =
    "mx-auto w-full max-w-[1300px] min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10";

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground">
      <div className={containerClass}>
        {/* Hero / Search Section */}
        <div className="linear-card rounded-[2.5rem] p-10 sm:p-12 mb-16 shadow-md animate-in fade-in slide-in-from-top-10 duration-1000">
          <p className="mb-3 text-xs font-semibold text-primary">
            Job Management
          </p>
          <h1 className="mb-2 text-3xl font-bold text-foreground lg:text-5xl tracking-tighter">
            Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-400">Postings</span>
          </h1>
          <p className="mb-10 text-muted-foreground font-medium italic">
            Monitor, update, and manage your active and past job opportunities from this centralized hub.
          </p>

          <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            {/* Row 1: Search + Category + Sort */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  placeholder="Search by job title, description, or keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-12 pl-12 rounded-xl bg-white border-slate-200 focus:ring-primary/20 focus:border-primary text-foreground font-medium shadow-sm"
                />
              </div>
              <div className="w-[200px]">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 text-xs font-semibold focus:ring-primary/20 shadow-sm">
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
              </div>
              <div className="w-[180px]">
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 text-xs font-semibold focus:ring-primary/20 shadow-sm">
                    <SelectValue placeholder="Sort Order" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-lg">
                    <SelectItem value="desc" className="text-xs font-semibold">Latest First</SelectItem>
                    <SelectItem value="asc" className="text-xs font-semibold">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Location (Horizontal Row) + Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-slate-200/60">
              <div className="flex-1 min-w-[300px]">
                <div className="[&>div]:flex [&>div]:flex-row [&>div]:gap-4 [&>div]:items-center [&>div>div]:flex-1 [&>div>div>label]:hidden">
                  <LocationDropdown value={location} onChange={setLocation} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  style={{ color: "white" }}
                  className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 border-0 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                >
                  <span style={{ color: "white" }}>Search</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClear}
                  disabled={loading}
                  className="h-12 px-6 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-foreground hover:bg-slate-200"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 animate-in fade-in duration-1000">
          <div>
            <p className="text-xs font-semibold text-primary flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live Updates
            </p>
            <p className="mt-1 text-sm font-bold text-muted-foreground uppercase tracking-widest">{total} Job{total !== 1 && "s"} Found</p>
          </div>
          <Link href="/employer/jobs/new">
            <Button className="h-14 px-10 rounded-2xl bg-primary hover:bg-blue-600 text-white font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-3">
              <Plus className="h-5 w-5" />
              Post a Job
            </Button>
          </Link>
        </div>

        <div className="mt-6 w-full">
          {/* Right Content */}
          <div className="w-full">
            {!loading && jobs.length > 0 && (
              <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-right-5 duration-700">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-8 rounded-full bg-primary/30" />
                  <p className="text-xs font-semibold text-muted-foreground/60">
                    Showing {jobs.length} Jobs
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={`h-10 w-10 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm" : "text-muted-foreground hover:bg-slate-200"}`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("table")}
                      className={`h-10 w-10 rounded-lg transition-all ${viewMode === "table" ? "bg-white shadow-sm" : "text-muted-foreground hover:bg-slate-200"}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
                {loading ? (
                  <div className="rounded-[2.5rem] p-24 text-center animate-pulse border border-slate-200">
                    <p className="text-lg font-semibold text-muted-foreground/40 italic">Loading Jobs...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="rounded-[2.5rem] p-24 text-center border border-slate-200">
                    <p className="text-lg font-semibold text-muted-foreground/60">No matching jobs found.</p>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2">
                    {jobs.map((job, idx) => (
                      <div
                        key={job.id}
                        className="linear-card group flex flex-col overflow-hidden rounded-2xl shadow-md p-5 transition-all hover:shadow-xl hover:border-primary/30 animate-in slide-in-from-bottom-10 duration-700 fill-mode-both"
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
                                <span className={`h-1.5 w-1.5 rounded-full ${job.status === "ACTIVE" ? "bg-emerald-400" : "bg-primary"}`} />
                                <span className={`text-xs font-semibold ${job.status === "ACTIVE" ? "text-emerald-400" : "text-primary opacity-60"}`}>
                                  {job.status}
                                </span>
                              </div>
                              <Link href={`/employer/jobs/${job.id}`}>
                                <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                                  {job.title}
                                </h3>
                              </Link>
                              <p className="mt-1 text-xs font-semibold text-muted-foreground/70">
                                {job.companyName || job.employer?.companyName}
                              </p>
                              <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                <MapPin className="h-3 w-3 text-primary" />
                                {formatLocation(job.location, true)}
                              </p>
                            </div>
                          </div>
                          <Link href={`/employer/jobs/${job.id}/edit`} className="shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 bg-slate-100 border border-slate-200 hover:bg-primary/20 hover:border-primary/30 text-primary rounded-lg transition-all"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/5 border border-primary/20 text-[11px] font-semibold text-primary">
                            {job.category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
                            {job.status === "PAUSED" ? "Paused" : job.status === "CLOSED" ? "Closed" : job.status}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-primary" />
                            Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ""}
                          </span>
                          {formatSalary(job) && (
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary shadow-lg shadow-primary/5">
                              {formatSalary(job)}
                            </span>
                          )}
                        </div>

                        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                          <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            {job._count.applications} Applications Received
                          </span>
                          <div className="flex items-center gap-2">
                            <ShareJobButton
                              jobId={job.id}
                              jobTitle={job.title}
                              className="h-9 w-9 bg-slate-100 border-slate-200 hover:bg-slate-200 text-foreground rounded-lg"
                            />
                            <div className="h-9 px-2 rounded-lg bg-slate-100 border border-slate-200 flex items-center">
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
                              className="w-full h-11 rounded-lg bg-primary hover:bg-blue-600 text-white font-bold text-xs transition-all shadow-lg shadow-primary/20"
                            >
                              Manage Job Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="linear-card rounded-[2rem] overflow-hidden shadow-md animate-in fade-in duration-700">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="py-8 px-6 text-xs font-semibold text-muted-foreground">Job Code</th>
                            <th className="py-8 px-6 text-xs font-semibold text-muted-foreground">Job Title</th>
                            <th className="py-8 px-6 text-xs font-semibold text-muted-foreground">Client</th>
                            <th className="py-8 px-6 text-xs font-semibold text-muted-foreground">Location</th>
                            <th className="py-8 px-6 text-xs font-semibold text-muted-foreground">State</th>
                            <th className="py-8 px-6 text-xs font-semibold text-muted-foreground">Job Status</th>
                            <th className="py-8 px-6 text-xs font-semibold text-muted-foreground">Salary (Min - Max)</th>
                            <th className="py-8 px-6 text-xs font-semibold text-muted-foreground">Primary Recruiter</th>
                            <th className="py-8 px-6 text-xs font-semibold text-muted-foreground">Job Created (Date)</th>
                          </tr>
                        </thead>
                        <tbody>
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
                              <tr key={job.id} className="bg-transparent">
                                <td colSpan={9} className="p-0 pb-6 bg-transparent">
                                  <div className="flex flex-col w-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300 overflow-hidden">
                                    {/* Main Row Information */}
                                    <div className="grid grid-cols-9 w-full items-center py-10 px-6 text-left bg-white">
                                      <div className="font-bold text-xs text-primary">{jobCode}</div>
                                      <div className="col-span-1 pr-4">
                                        <Link href={`/employer/jobs/${job.id}`}>
                                          <p className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-1">{job.title}</p>
                                        </Link>
                                      </div>
                                      <div className="text-xs font-semibold text-slate-700 truncate pr-4">{clientName}</div>
                                      <div className="text-xs font-semibold text-slate-600 truncate pr-4">{locationCity}</div>
                                      <div className="text-xs font-semibold text-slate-500 truncate pr-4">{locationState}</div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className={`h-1.5 w-1.5 rounded-full ${job.status === "ACTIVE" ? "bg-emerald-400" : "bg-primary"}`} />
                                          <span className={`text-xs font-semibold ${job.status === "ACTIVE" ? "text-emerald-400" : "text-primary opacity-60"}`}>
                                            {job.status}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-xs font-semibold text-slate-750 truncate pr-4">{salaryRange}</div>
                                      <div className="text-xs font-semibold text-slate-600 truncate pr-4">{primaryRecruiter}</div>
                                      <div className="text-xs font-semibold text-slate-500">{createdDate}</div>
                                    </div>

                                    {/* Action Row Below */}
                                    <div className="border-t border-slate-100/80 bg-slate-50/50 py-4 px-6 flex items-center justify-between">
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
                                            className="h-9 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs gap-1.5 transition-all shadow-sm"
                                          >
                                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                            Edit
                                          </Button>
                                        </Link>
                                        <Link href={`/employer/jobs/${job.id}`}>
                                          <Button variant="default" size="sm" className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/10">
                                            Manage Details
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
                      className="h-10 px-6 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-foreground hover:bg-slate-200 disabled:opacity-30 transition-all"
                    >
                      Previous Page
                    </Button>
                    <span className="px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-foreground hover:bg-white/10 disabled:opacity-30 transition-all"
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
