"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatLocation, formatSalary } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import { CheckCircle2, Search } from "lucide-react";
import ShareJobButton from "@/components/ShareJobButton";
import CompanyLogo from "@/components/CompanyLogo";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  salaryRange?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  payType?: string | null;
  employmentType: string;
  experienceRequired?: number | null;
  employer: { companyName: string; companyLogo?: string | null };
  createdAt: string;
}

interface CategoryOption {
  id: string;
  name: string;
  status: string;
}

interface FetchResult {
  jobs: Job[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  appliedJobIds: string[];
}

export default function JobSearch() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const appliedSet = useMemo(() => new Set(appliedJobIds), [appliedJobIds]);

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
        params.set("limit", "10");
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (categoryVal && categoryVal !== "all")
          params.set("category", categoryVal);
        if (locationVal.trim())
          params.set("location", encodeURIComponent(locationVal.trim()));
        const res = await fetch(`/api/user/jobs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: FetchResult = await res.json();
        setJobs(data.jobs ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? 1);
        setAppliedJobIds(data.appliedJobIds ?? []);
      } catch {
        setJobs([]);
        setTotal(0);
        setTotalPages(0);
        setAppliedJobIds([]);
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

  const start = total === 0 ? 0 : (page - 1) * 10 + 1;
  const end = Math.min(page * 10, total);

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-80">
        <div className="linear-card sticky top-28 rounded-[2.5rem] p-10 space-y-10 animate-in slide-in-from-left-4 duration-700">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-semibold text-foreground">Search Filters</h2>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground">Keyword Search</label>
                <Input
                  placeholder="Search keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                  className="h-12 rounded-2xl bg-white/[0.03] border-white/5 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/40 transition-all">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-3xl border-white/10 rounded-2xl">
                    <SelectItem value="all" className="text-xs font-semibold">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name} className="text-xs font-semibold">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground">Location</label>
                <div className="relative">
                  <LocationDropdown value={location} onChange={setLocation} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-10 border-t border-white/5">
            <Button onClick={handleSearch} disabled={loading} className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/20">
              Search Jobs
            </Button>
            <Button variant="ghost" onClick={handleClear} disabled={loading} className="h-12 rounded-2xl text-xs font-semibold text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-all">
              Clear Filters
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-muted-foreground">
            <span className="font-bold text-foreground">{total}</span> Jobs Found
            <span className="mx-4 text-white/10">/</span>
            Showing {start} - {end}
          </p>
        </div>
        
        {loading ? (
          <div className="linear-card rounded-[2.5rem] p-24 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-6" />
            <p className="text-sm font-semibold text-muted-foreground">Searching Jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="linear-card rounded-[3rem] p-24 text-center border-dashed border-white/5 bg-white/[0.01]">
            <div className="mx-auto h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
               <Search className="size-8 text-muted-foreground/20" />
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tighter mb-4 italic">No Jobs Found</p>
            <p className="text-muted-foreground font-medium italic mb-10 max-w-sm mx-auto opacity-40">No jobs matched your search. Try adjusting your filters.</p>
            <Button variant="outline" onClick={handleClear} className="h-14 px-10 rounded-2xl border-white/10 hover:bg-white/5 text-xs font-semibold transition-all hover:scale-[1.02]">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job, idx) => (
              <div key={job.id} 
                className="linear-card group rounded-[2.5rem] p-10 animate-in slide-in-from-right-10 duration-700 hover:border-primary/30 transition-all shadow-2xl hover:shadow-primary/5 relative overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="h-1 w-20 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm" />
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                  <CompanyLogo
                    companyLogo={job.employer.companyLogo}
                    companyName={job.employer.companyName}
                    size="lg"
                    className="shrink-0 rounded-2xl border-2 border-white/10 bg-background/50 group-hover:border-primary/20 shadow-2xl transition-transform group-hover:scale-105 md:scale-110"
                  />
                  <div className="min-w-0 flex-1 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <Link href={`/jobs/${job.id}`}>
                          <h3 className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                            {job.title}
                          </h3>
                        </Link>
                        {appliedSet.has(job.id) && (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-400 flex items-center gap-2 mx-auto md:mx-0">
                            <CheckCircle2 className="size-3.5" />
                            Applied
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-muted-foreground/50">{job.employer.companyName}</p>
                      
                      <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
                        <span className="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-semibold text-muted-foreground/60 whitespace-nowrap">
                          {formatLocation(job.location, true)}
                        </span>
                        <span className="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-semibold text-muted-foreground/60 whitespace-nowrap">
                          {job.category}
                        </span>
                        <span className="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-semibold text-muted-foreground/60 whitespace-nowrap">
                          {job.employmentType}
                        </span>
                        {formatSalary(job) && (
                          <span className="px-5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary whitespace-nowrap shadow-xl shadow-primary/10">
                            {formatSalary(job)}
                          </span>
                        )}
                      </div>
                      <p className="mt-8 line-clamp-2 text-base font-medium text-muted-foreground/60 italic leading-relaxed">
                        &quot;{job.description}&quot;
                      </p>
                      
                      <div className="mt-10 pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                          <ShareJobButton jobId={job.id} jobTitle={job.title} className="h-12 w-12 rounded-xl bg-white/5 border-white/5 hover:bg-primary/10 hover:text-primary transition-all active:scale-90" />
                          <div className="hidden sm:block">
                             <p className="text-xs font-semibold text-muted-foreground/40">Posted On</p>
                             <p className="text-xs font-semibold text-emerald-500/60">
                               {new Date(job.createdAt).toLocaleDateString()} at {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                          </div>
                        </div>
                        <Link href={`/jobs/${job.id}`} className="w-full sm:w-auto">
                          <Button className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 group shadow-lg shadow-blue-500/10">
                            Apply Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && totalPages > 1 && (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-10 px-6 rounded-xl text-xs font-semibold text-muted-foreground/40 hover:text-foreground transition-all"
          >
            ← Previous Page
          </Button>
          <div className="flex items-center gap-2">
            {(() => {
              const pages: (number | "ellipsis")[] = [];
              const show = 2;
              if (totalPages <= 5) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                if (page <= show) {
                  for (let i = 1; i <= show + 1; i++) pages.push(i);
                  pages.push("ellipsis");
                  pages.push(totalPages);
                } else if (page >= totalPages - show + 1) {
                  pages.push(1);
                  pages.push("ellipsis");
                  for (let i = totalPages - show; i <= totalPages; i++)
                    pages.push(i);
                } else {
                  pages.push(1);
                  pages.push("ellipsis");
                  for (let i = page - 1; i <= page + 1; i++) pages.push(i);
                  pages.push("ellipsis");
                  pages.push(totalPages);
                }
              }
              return pages.map((p, i) =>
                p === "ellipsis" ? (
                  <span key={`e-${i}`} className="px-3 text-white/10">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant="ghost"
                    size="sm"
                    className={`h-10 w-10 p-0 rounded-xl text-xs font-semibold transition-all ${
                      page === p 
                        ? "bg-primary text-white shadow-xl shadow-primary/20 border border-primary/40" 
                        : "text-muted-foreground/40 hover:bg-white/5 hover:text-foreground"
                    }`}
                    onClick={() => setPage(p)}
                  >
                    {p.toString().padStart(2, '0')}
                  </Button>
                )
              );
            })()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-10 px-6 rounded-xl text-xs font-semibold text-muted-foreground/40 hover:text-foreground transition-all"
          >
            Next Page →
          </Button>
        </div>
        )}
      </div>
    </div>
  );
}
