"use client";

import { useState, useEffect, useCallback } from "react";
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
import { formatLocation } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import CompanyLogo from "@/components/CompanyLogo";

interface ApplicationItem {
  id: string;
  status: string;
  appliedAt: string;
  coverLetter: string | null;
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    category: string;
    status: string;
    employer: { companyName: string; companyLogo?: string | null };
  };
}

interface CategoryOption {
  id: string;
  name: string;
  status: string;
}

interface FetchResult {
  applications: ApplicationItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export default function ApplicationSearch() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
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

  const fetchApplications = useCallback(
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
        params.set("limit", "10");
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (categoryVal && categoryVal !== "all")
          params.set("category", categoryVal);
        if (locationVal.trim())
          params.set("location", encodeURIComponent(locationVal.trim()));
        if (statusVal && statusVal !== "all") params.set("status", statusVal);
        const res = await fetch(`/api/user/applications?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: FetchResult = await res.json();
        setApplications(data.applications ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? 1);
      } catch {
        setApplications([]);
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
    fetchApplications(
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
    fetchApplications,
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

  const start = total === 0 ? 0 : (page - 1) * 10 + 1;
  const end = Math.min(page * 10, total);

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-80">
        <div className="linear-card sticky top-28 rounded-[2rem] p-8 space-y-8 animate-in slide-in-from-left-4 duration-700">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-6">Filter Applications</h2>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground">Keywords</label>
                <Input
                  placeholder="Job title or keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                  className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-white/10">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
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
              <div className="space-y-4">
                <label className="text-xs font-semibold text-muted-foreground">Pipeline Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["all", "PENDING", "REVIEWED", "SHORTLISTED", "REJECTED"] as const).map((s) => (
                    <Button
                      key={s}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatus(s);
                        setAppliedStatus(s);
                        setPage(1);
                      }}
                      disabled={loading}
                      className={`h-10 text-xs font-semibold rounded-lg border border-white/5 transition-all ${
                        appliedStatus === s
                          ? "bg-white/10 text-foreground border-white/20 shadow-lg"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
            <Button onClick={handleSearch} disabled={loading} className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20">
              Search Applications
            </Button>
            <Button variant="ghost" onClick={handleClear} disabled={loading} className="h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 font-bold">
              Reset
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-muted-foreground">
            <span className="font-bold text-foreground">{total}</span> Pipeline Items
            <span className="mx-4 text-white/10">/</span>
            Result set {start} - {end}
          </p>
        </div>
        
        {loading ? (
          <div className="linear-card rounded-[2.5rem] p-24 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-6" />
            <p className="text-sm font-semibold text-muted-foreground">Synchronizing Applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="linear-card rounded-[2.5rem] p-24 text-center">
              {total === 0 && !appliedSearch && !appliedCategory && !appliedLocation && appliedStatus === "all" ? (
                <>
                  <p className="text-xl font-bold text-foreground mb-4">
                    Your pipeline is empty
                  </p>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                    Discover opportunities matched to your profile and start your next career move.
                  </p>
                  <Link href="/user/jobs">
                    <Button className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                      Explore Jobs Feed
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="max-w-sm mx-auto">
                  <p className="text-xl font-bold text-foreground mb-4">No matches found</p>
                  <p className="text-muted-foreground mb-8">Try adjusting your filters or clearing them to see all applications.</p>
                  <Button variant="outline" onClick={handleClear} className="h-12 px-8 rounded-xl border-white/10 hover:bg-white/5 font-bold transition-all">
                    Reset Selection
                  </Button>
                </div>
              )}
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application, idx) => (
              <div
                key={application.id}
                className="linear-card group rounded-[2rem] p-8 animate-in slide-in-from-right-10 duration-700 hover:border-primary/20 transition-all shadow-lg hover:shadow-primary/5"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <CompanyLogo
                      companyLogo={application.job.employer.companyLogo}
                      companyName={application.job.employer.companyName}
                      size="lg"
                      className="shrink-0 rounded-[1.25rem] border border-white/10 bg-white/5 group-hover:border-white/20 scale-110 md:scale-100"
                    />
                    <div className="min-w-0 flex-1 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <Link href={`/jobs/${application.job.id}`}>
                          <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-8">
                            {application.job.title}
                          </h3>
                        </Link>
                        <span
                          className={`rounded-full px-5 py-2 text-xs font-semibold shadow-xl transition-all w-fit mx-auto md:mx-0 ${
                            application.status === "SHORTLISTED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : application.status === "REJECTED"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {application.status}
                        </span>
                      </div>
                      <p className="mt-2 text-lg font-bold text-foreground opacity-80">
                        {application.job.employer.companyName}
                      </p>
                      <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                        <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {formatLocation(application.job.location, true)}
                        </span>
                        <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {application.job.category}
                        </span>
                        {(application.job.status === "PAUSED" ||
                          application.job.status === "CLOSED" ||
                          application.job.status === "INACTIVE") && (
                          <span className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 whitespace-nowrap">
                            {application.job.status.toLowerCase()}
                          </span>
                        )}
                      </div>
                      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs font-semibold text-muted-foreground/40">
                          Transmission Date <span className="text-muted-foreground/60 ml-2">{new Date(application.appliedAt).toLocaleDateString()}</span>
                        </p>
                        {application.coverLetter && (
                          <div className="group/note relative">
                            <p className="line-clamp-1 text-xs font-medium text-muted-foreground/60 italic max-w-md">
                              &quot;{application.coverLetter}&quot;
                            </p>
                          </div>
                        )}
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
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Previous
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
                  <span key={`e-${i}`} className="px-2 text-white/20">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant="ghost"
                    size="sm"
                    className={`h-10 w-10 p-0 rounded-xl text-xs font-semibold transition-all ${
                      page === p 
                        ? "bg-white/10 text-white border border-white/20 shadow-lg shadow-white/5" 
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                    onClick={() => setPage(p)}
                  >
                    {p}
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
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Next
          </Button>
        </div>
        )}
      </div>
    </div>
  );
}
