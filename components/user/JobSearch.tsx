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
import { formatLocation } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import { CheckCircle2 } from "lucide-react";
import ShareJobButton from "@/components/ShareJobButton";
import CompanyLogo from "@/components/CompanyLogo";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  salaryRange?: string | null;
  employmentType: string;
  experienceRequired?: number | null;
  employer: { companyName: string; companyLogo?: string | null };
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
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:w-72">
        <h2 className="mb-4 font-semibold text-gray-900">Filter jobs</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Search</label>
            <Input
              placeholder="Title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Location</label>
            <LocationDropdown value={location} onChange={setLocation} />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]">
            Apply filters
          </Button>
          <Button variant="outline" onClick={handleClear} disabled={loading} className="w-full border-gray-300">
            Clear filters
          </Button>
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">{total} Jobs Found</span>
            <span className="ml-2 text-sm">Showing {start} - {end}</span>
          </p>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
            No jobs found. Try adjusting filters or clear filters.
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start gap-4">
                  <CompanyLogo
                    companyLogo={job.employer.companyLogo}
                    companyName={job.employer.companyName}
                    size="md"
                    className="shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                      <Link href={`/user/jobs/${job.id}`}>
                        <h3 className="text-xl font-semibold hover:text-blue-600">
                          {job.title}
                        </h3>
                      </Link>
                      <p className="mt-1 text-gray-600">{job.employer.companyName}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {appliedSet.has(job.id) && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                            Already applied
                          </span>
                        )}
                        <Badge variant="outline">
                          {formatLocation(job.location)}
                        </Badge>
                        <Badge variant="outline">{job.category}</Badge>
                        <Badge variant="outline">{job.employmentType}</Badge>
                        {job.salaryRange && (
                          <Badge variant="outline">{job.salaryRange}</Badge>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {job.description}
                      </p>
                    </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ShareJobButton jobId={job.id} jobTitle={job.title} className="h-9 w-9" />
                    <Link href={`/user/jobs/${job.id}`}>
                      <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">View Details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {(() => {
              const pages: (number | "ellipsis")[] = [];
              const show = 3;
              if (totalPages <= 7) {
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
                  <span key={`e-${i}`} className="px-2 text-gray-400">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    size="sm"
                    className="min-w-[2.25rem]"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                )
              );
            })()}
          </div>
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
  );
}
