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
import { Search, Briefcase, MapPin, Calendar, Plus, LayoutGrid, List, FileText } from "lucide-react";
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
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const limit = 12;

  const fetchJobs = useCallback(
    async (
      pageNum: number,
      searchVal: string,
      categoryVal: string,
      locationVal: string
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
    fetchJobs(page, appliedSearch, appliedCategory, appliedLocation);
  }, [page, appliedSearch, appliedCategory, appliedLocation, fetchJobs]);

  const handleSearch = () => {
    setAppliedSearch(search);
    setAppliedCategory(category);
    setAppliedLocation(location);
    setPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setCategory("all");
    setLocation("");
    setAppliedSearch("");
    setAppliedCategory("all");
    setAppliedLocation("");
    setPage(1);
  };

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const containerClass =
    "mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10";

  return (
    <div className="min-h-screen w-full min-w-0 bg-black">
      <div className={containerClass}>
        {/* Hero / Search Section */}
        <div className="linear-card rounded-[2.5rem] bg-white/[0.02] p-10 sm:p-12 mb-16 animate-in fade-in slide-in-from-top-10 duration-1000">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
            Job Management
          </p>
          <h1 className="mb-2 text-3xl font-black text-foreground lg:text-5xl tracking-tighter">
            Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-400">Postings</span>
          </h1>
          <p className="mb-10 text-muted-foreground font-medium italic">
            Monitor, update, and manage your active and past job opportunities from this centralized hub.
          </p>

          <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-white/5 bg-black/20 p-4 shadow-2xl">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                placeholder="Search by job title, description, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-12 pl-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50 text-foreground font-medium"
              />
            </div>
            <div className="w-[200px]">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest focus:ring-primary/20">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-white/5">
                  <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name} className="text-[10px] font-black uppercase tracking-widest">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-12 px-8 rounded-xl bg-primary hover:bg-blue-600 text-white font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                Search
              </Button>
              <Button
                variant="ghost"
                onClick={handleClear}
                disabled={loading}
                className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 animate-in fade-in duration-1000">
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Live Updates
              </p>
              <p className="mt-1 text-sm font-bold text-muted-foreground uppercase tracking-widest">{total} Job{total !== 1 && "s"} Found</p>
           </div>
           <Link href="/employer/jobs/new">
             <Button className="h-14 px-10 rounded-2xl bg-primary hover:bg-blue-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-3">
               <Plus className="h-5 w-5" />
               Post a Job
             </Button>
           </Link>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* Left Filter Panel */}
          <aside className="w-full shrink-0 lg:w-80 space-y-8 animate-in slide-in-from-left-10 duration-1000">
            <div className="linear-card rounded-[2rem] p-8 space-y-8 border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <Search className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Advanced Filters</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Search Key</label>
                  <Input
                    placeholder="Refine search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Location Hub</label>
                  <LocationDropdown value={location} onChange={setLocation} />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Job Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                      <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name} className="text-[10px] font-black uppercase tracking-widest">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4 space-y-3">
                  <Button
                    onClick={handleSearch}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClear}
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
                  >
                    Reset All
                  </Button>
                </div>
              </div>
            </div>

            <div className="linear-card rounded-[2rem] p-8 bg-primary/5 border-primary/20">
               <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Job Status Tip</h3>
               <p className="text-xs text-muted-foreground leading-loose font-medium italic">
                 "Keep your job postings up to date. Active jobs are visible to candidates, while closed jobs are archived for your records."
               </p>
            </div>
          </aside>

          {/* Right Content */}
            <div className="flex-1">
              {!loading && jobs.length > 0 && (
                <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-right-5 duration-700">
                  <div className="flex items-center gap-3">
                    <div className="h-1 w-8 rounded-full bg-primary/30" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Showing {jobs.length} Jobs
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={`h-10 w-10 rounded-lg transition-all ${viewMode === "grid" ? "toggle-active" : "text-muted-foreground hover:bg-white/10"}`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("table")}
                      className={`h-10 w-10 rounded-lg transition-all ${viewMode === "table" ? "toggle-active" : "text-muted-foreground hover:bg-white/10"}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {loading ? (
                <div className="linear-card rounded-[2.5rem] p-24 text-center animate-pulse border-white/5">
                   <p className="text-lg font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Loading Jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="linear-card rounded-[2.5rem] p-24 text-center border-white/5">
                   <p className="text-lg font-black uppercase tracking-[0.2em] text-muted-foreground/60">No matching jobs found.</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2">
                  {jobs.map((job, idx) => (
                    <div
                      key={job.id}
                      className="group flex flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 transition-all hover:bg-white/5 hover:border-primary/30 animate-in slide-in-from-bottom-10 duration-700 fill-mode-both"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex items-start gap-6">
                        <CompanyLogo
                          companyLogo={job.employer?.companyLogo}
                          companyName={job.employer?.companyName ?? job.title}
                          size="lg"
                          className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${job.status === "ACTIVE" ? "bg-emerald-400" : "bg-primary"}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${job.status === "ACTIVE" ? "text-emerald-400" : "text-primary opacity-60"}`}>
                              {job.status}
                            </span>
                          </div>
                          <Link href={`/employer/jobs/${job.id}`}>
                            <h3 className="text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                              {job.title}
                            </h3>
                          </Link>
                          <p className="mt-2 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <MapPin className="h-3 w-3 text-primary" />
                            {formatLocation(job.location)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary">
                          {job.category}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          {job.status === "PAUSED" ? "Paused" : job.status === "CLOSED" ? "Closed" : job.status}
                        </span>
                        {formatSalary(job) && (
                          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary shadow-lg shadow-primary/5">
                            {formatSalary(job)}
                          </span>
                        )}
                      </div>

                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          {job._count.applications} Applications Received
                        </span>
                        <div className="flex items-center gap-2">
                          <ShareJobButton 
                            jobId={job.id} 
                            jobTitle={job.title} 
                            className="h-10 w-10 bg-white/5 border-white/10 hover:bg-white/10 text-foreground rounded-xl" 
                          />
                          <div className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center">
                            <JobStatusActions
                              jobId={job.id}
                              jobTitle={job.title}
                              currentStatus={job.status}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Link href={`/employer/jobs/${job.id}`} className="w-full">
                          <Button
                            variant="default"
                            className="w-full h-12 rounded-xl bg-primary hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-primary/20"
                          >
                            Manage Job Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] overflow-hidden animate-in fade-in duration-700">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Job Title</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Applicants</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.map((job) => (
                          <tr key={job.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <CompanyLogo
                                  companyLogo={job.employer?.companyLogo}
                                  companyName={job.employer?.companyName ?? job.title}
                                  size="sm"
                                  className="h-10 w-10 rounded-lg bg-white/5 border border-white/10"
                                />
                                <div className="min-w-0">
                                  <Link href={`/employer/jobs/${job.id}`}>
                                    <p className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{job.title}</p>
                                  </Link>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{formatLocation(job.location)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <span className={`h-1.5 w-1.5 rounded-full ${job.status === "ACTIVE" ? "bg-emerald-400" : "bg-primary"}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${job.status === "ACTIVE" ? "text-emerald-400" : "text-primary opacity-60"}`}>
                                  {job.status}
                                </span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{job.category}</span>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground">
                                <FileText className="h-3 w-3 text-primary" />
                                {job._count.applications}
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center justify-end gap-2">
                                <ShareJobButton jobId={job.id} jobTitle={job.title} className="h-8 w-8 bg-white/5 border-white/10 hover:bg-white/10" />
                                <div className="h-8 px-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center">
                                  <JobStatusActions
                                    jobId={job.id}
                                    jobTitle={job.title}
                                    currentStatus={job.status}
                                  />
                                </div>
                                <Link href={`/employer/jobs/${job.id}`}>
                                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-white/10 hover:bg-primary hover:border-primary hover:text-white transition-all">
                                    Manage
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
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
                    className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    Previous Page
                  </Button>
                  <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 disabled:opacity-30 transition-all"
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
