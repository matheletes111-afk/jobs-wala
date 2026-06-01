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
  ChevronRight,
  Briefcase,
  Calendar,
  Download,
} from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import ShareJobButton from "@/components/ShareJobButton";

interface JobItem {
  id: string;
  title: string;
  location: string;
  category: string;
  status: string;
  experienceMin?: number | null;
  experienceMax?: number | null;
  employmentType?: string;
  workMode?: string;
  requiredSkills?: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  payType?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
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
  const [sort, setSort] = useState("desc");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const [appliedSort, setAppliedSort] = useState("desc");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const limit = 12;

  const fetchJobs = useCallback(
    async (
      pageNum: number,
      searchVal: string,
      categoryVal: string,
      locationVal: string,
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
      appliedStatus,
      appliedSort
    );
  }, [
    page,
    appliedSearch,
    appliedCategory,
    appliedLocation,
    appliedStatus,
    appliedSort,
    fetchJobs,
  ]);

  const handleSearch = () => {
    setAppliedSearch(search);
    setAppliedCategory(category);
    setAppliedLocation(location);
    setAppliedStatus(status);
    setAppliedSort(sort);
    setPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setCategory("all");
    setLocation("");
    setStatus("all");
    setSort("desc");
    setAppliedSearch("");
    setAppliedCategory("all");
    setAppliedLocation("");
    setAppliedStatus("all");
    setAppliedSort("desc");
    setPage(1);
  };

  const handleExportCSV = () => {
    if (jobs.length === 0) return;
    const headers = [
      "ID", "Title", "Company Name", "Industry", "Location", "Category", 
      "Status", "Employment Type", "Work Mode", "Experience Required",
      "Salary Range", "Skills", "Applications Count", "Created At", "Expires At"
    ];

    const rows = jobs.map(job => {
      const location = formatLocation(job.location, true);
      const experience = job.experienceMin != null && job.experienceMax != null 
        ? `${job.experienceMin}-${job.experienceMax} YRS` 
        : job.experienceMin != null ? `${job.experienceMin}+ YRS` : "";
        
      const salary = job.salaryMin != null && job.salaryMax != null
        ? `${job.currency || ""} ${job.salaryMin}-${job.salaryMax} / ${job.payType || ""}`
        : "";

      return [
        job.id,
        `"${(job.title || "").replace(/"/g, '""')}"`,
        `"${(job.employer.companyName || "").replace(/"/g, '""')}"`,
        `"${(job.employer.industry || "").replace(/"/g, '""')}"`,
        `"${location.replace(/"/g, '""')}"`,
        `"${(job.category || "").replace(/"/g, '""')}"`,
        job.status,
        job.employmentType || "",
        job.workMode || "",
        `"${experience}"`,
        `"${salary}"`,
        `"${(job.requiredSkills || []).join(", ").replace(/"/g, '""')}"`,
        job._count.applications,
        job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : "",
        job.expiresAt ? new Date(job.expiresAt).toISOString().split('T')[0] : ""
      ];
    });

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

  const handleJobUpdated = useCallback(() => {
    fetchJobs(
      page,
      appliedSearch,
      appliedCategory,
      appliedLocation,
      appliedStatus,
      appliedSort
    );
  }, [
    page,
    appliedSearch,
    appliedCategory,
    appliedLocation,
    appliedStatus,
    appliedSort,
    fetchJobs,
  ]);

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const containerClass =
    "mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10";

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      <div className={containerClass}>
        {/* Broadcast Monitoring Header */}
        <div className="mb-16 border-b border-white/5 pb-12">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-xs font-semibold text-blue-500">Job Management</p>
           </div>
            <h1 className="text-4xl font-bold md:text-6xl tracking-tighter text-white">
              Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Administration</span>
            </h1>
           <p className="mt-4 text-lg font-medium text-muted-foreground/60 italic">
             Monitor, approve, and manage job listings across the platform.
           </p>
           
           <div className="mt-12 flex flex-wrap items-center gap-4 p-4 rounded-3xl bg-gradient-to-br from-blue-50 to-orange-50 border border-blue-200 shadow-sm backdrop-blur-3xl">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 opacity-50" />
                <Input
                  placeholder="Search job titles or keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-12 pl-12 bg-transparent border-transparent focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/30 font-semibold text-xs"
                />
              </div>
              <div className="w-[180px]">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10">
                    <SelectItem value="desc">Latest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-12 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                Search Jobs
              </Button>
           </div>
        </div>

        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Tactical Filters Sidebar */}
          <aside className="w-full shrink-0 lg:w-80">
            <div className="linear-card sticky top-32 rounded-[2.5rem] p-8 bg-gradient-to-br from-blue-50 to-orange-50 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                <h2 className="text-sm font-semibold text-foreground">Filters</h2>
              </div>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-muted-foreground/40 italic flex items-center gap-2">
                    <Briefcase className="h-3 w-3" />
                    Search Keywords
                  </label>
                  <Input
                    placeholder="Keywords..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground placeholder:text-muted-foreground/20"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-muted-foreground/40 italic flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Location
                  </label>
                  <LocationDropdown value={location} onChange={setLocation} />
                </div>
                
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-muted-foreground/40 italic flex items-center gap-2">
                    <LayoutGrid className="h-3 w-3" />
                    Category
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10">
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-muted-foreground/40 italic flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Sort By Date
                  </label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10">
                      <SelectItem value="desc">Latest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-6 flex flex-col gap-3">
                   <Button
                    onClick={handleSearch}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClear}
                    className="h-12 w-full rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-white/5 transition-all"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          {/* Result Grid */}
          <div className="flex-1 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
              <div className="flex flex-col gap-1">
                 <p className="text-3xl font-bold text-foreground tracking-tighter tabular-nums">
                   {total} <span className="text-sm font-semibold text-blue-500 opacity-60 ml-2">Jobs</span>
                 </p>
                 <p className="text-xs font-semibold text-muted-foreground/40 italic">
                    Showing {start} - {end} jobs
                 </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-foreground"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <div className="flex p-1 rounded-xl bg-white/5 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-2.5 transition-all ${viewMode === "grid" ? "toggle-active" : "text-muted-foreground hover:bg-white/5"}`}
                    aria-label="Grid Mode"
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded-lg p-2.5 transition-all ${viewMode === "list" ? "toggle-active" : "text-muted-foreground hover:bg-white/5"}`}
                    aria-label="List Mode"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
                
                 <div>
                  <Select value={sort} onValueChange={(v) => { setSort(v); setAppliedSort(v); setPage(1); }}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground">
                      <SelectValue placeholder="Sort Date" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10">
                      <SelectItem value="desc">Latest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                 </div>
              </div>
            </div>

            {loading ? (
              <div className="linear-card rounded-[3rem] p-32 text-center animate-pulse">
                <p className="text-sm font-semibold text-blue-500">Loading...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="linear-card rounded-[3rem] p-32 text-center border-dashed border-white/10">
                <p className="text-xl font-bold text-muted-foreground/40 italic leading-relaxed">
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
                  />
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
                  <Button
                  variant="ghost"
                  className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-xs font-semibold hover:bg-white/10 disabled:opacity-20 transition-all"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous Page
                </Button>
                <div className="px-8 flex flex-col items-center">
                   <p className="text-xs font-semibold text-blue-500">Page</p>
                   <p className="text-xl font-black mt-1 tabular-nums">{page} <span className="opacity-20">/</span> {totalPages}</p>
                </div>
                <Button
                  variant="ghost"
                  className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-xs font-semibold hover:bg-white/10 disabled:opacity-20 transition-all"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

function JobCard({
  job,
  onUpdated,
  index,
}: {
  job: JobItem;
  onUpdated: () => void;
  index: number;
}) {
  const statusLabel =
    job.status === "PAUSED"
      ? "SUBSIDED"
      : job.status === "CLOSED"
        ? "TERMINATED"
        : job.status;

  return (
    <div 
       className="linear-card group flex flex-col rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-orange-50 border border-blue-200 p-10 transition-all hover:shadow-md hover:border-blue-300 animate-in fade-in slide-in-from-bottom-5 duration-700"
       style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-4 mb-10">
        <div className="flex items-center gap-6">
          <CompanyLogo
            companyLogo={job.employer.companyLogo}
            companyName={job.employer.companyName}
            size="lg"
            className="h-16 w-16 rounded-2xl border-2 border-white/10 shadow-2xl transition-transform group-hover:scale-110"
          />
          <div className="min-w-0">
             <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex h-1.5 w-1.5 rounded-full ${job.status === "ACTIVE" ? "bg-blue-500" : job.status === "PENDING" ? "bg-orange-500" : "bg-red-500"}`} />
                <p className="text-xs font-semibold text-blue-500">{job.status === "ACTIVE" ? "ACTIVE JOB" : "PENDING REVIEW"}</p>
             </div>
             <h3 className="text-xl font-bold text-foreground tracking-tight line-clamp-1 group-hover:text-blue-500 transition-colors">{job.title}</h3>
             <p className="text-xs font-semibold text-muted-foreground/40 mt-1 italic">
                 {job.employer.companyName} {" // "} {job.employer.industry || "General Exploration"}
             </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-8">
         <div className="p-6 rounded-[1.5rem] bg-white/5 border border-white/5">
            <p className="text-sm leading-relaxed text-muted-foreground font-medium italic line-clamp-2">
               {job.employer.description ? `&quot;${job.employer.description}&quot;` : "Broadcast transmission contains encrypted mission objectives. Authentication required for full payload access."}
            </p>
         </div>

         <div className="flex flex-wrap gap-2">
             <span className="px-4 py-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs font-semibold text-blue-500/80">
               {job.category}
             </span>
             <span className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-muted-foreground/60 flex items-center gap-2 tabular-nums">
              <MapPin className="h-3 w-3" />
              {formatLocation(job.location, true)}
            </span>
         </div>
      </div>

      <div className="mt-10 pt-10 border-t border-white/5">
         <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
             <div className="flex items-center gap-6 text-xs font-semibold text-muted-foreground/30 tabular-nums">
               <span className="flex items-center gap-2 italic">
                 <Briefcase className="h-4 w-4" />
                 {job._count.applications} Applications
               </span>
               {job.createdAt && (
                 <>
                   <span className="flex items-center gap-2 italic">
                     <Calendar className="h-4 w-4" />
                     Posted: {new Date(job.createdAt).toLocaleDateString()}
                   </span>
                   <span className="flex items-center gap-2 italic">
                     ID-{new Date(job.createdAt).getTime().toString(36).toUpperCase()}
                   </span>
                 </>
               )}
             </div>
             
             <span
               className={`rounded-full px-4 py-1.5 text-xs font-semibold border ${
               job.status === "ACTIVE"
                 ? "bg-blue-50 text-blue-600 border-blue-200"
                 : job.status === "PENDING"
                   ? "bg-orange-50 text-orange-600 border-orange-200"
                   : "bg-slate-50 border-slate-200 text-slate-500"
             }`}
             >
              {statusLabel}
            </span>
         </div>

         <div className="flex flex-wrap items-center justify-end gap-3">
             <ShareJobButton jobId={job.id} jobTitle={job.title} className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl transition-all active:scale-90" />
             <div className="[&_button]:h-10 [&_button]:rounded-2xl [&_button]:text-xs [&_button]:font-semibold">
               <JobApprovalActions
                 jobId={job.id}
                 currentStatus={
                   job.status as "PENDING" | "ACTIVE" | "INACTIVE" | "PAUSED" | "CLOSED"
                 }
                 onSuccess={onUpdated}
               />
             </div>
             <Link href={`/admin/jobs/${job.id}`}>
               <Button variant="ghost" className="h-10 px-6 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-foreground hover:bg-white/10 transition-all active:scale-95 group">
                 View Job
                 <ChevronRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
               </Button>
             </Link>
         </div>
      </div>
    </div>
  );
}
