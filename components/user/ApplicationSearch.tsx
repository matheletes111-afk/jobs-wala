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
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:w-72">
        <h2 className="mb-4 font-semibold text-gray-900">Filter applications</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Search</label>
            <Input
              placeholder="Job title or cover letter..."
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
          <div>
            <label className="mb-2 block text-sm text-gray-600">Status</label>
            <div className="flex flex-wrap gap-2">
              {(["all", "PENDING", "REVIEWED", "SHORTLISTED", "REJECTED"] as const).map((s) => (
                <Button
                  key={s}
                  variant={appliedStatus === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatus(s);
                    setAppliedStatus(s);
                    setPage(1);
                  }}
                  disabled={loading}
                  className={appliedStatus === s ? "bg-[#2563eb] hover:bg-[#1d4ed8]" : ""}
                >
                  {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
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
            <span className="font-semibold text-gray-900">{total} Applications</span>
            <span className="ml-2 text-sm">Showing {start} - {end}</span>
          </p>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              {total === 0 && !appliedSearch && !appliedCategory && !appliedLocation && appliedStatus === "all" ? (
                <>
                  <p className="text-gray-500">
                    You haven&apos;t applied to any jobs yet.
                  </p>
                  <Link href="/user/jobs">
                    <span className="mt-4 inline-block text-blue-600 hover:underline">
                      Browse Jobs
                    </span>
                  </Link>
                </>
              ) : (
                <p className="text-gray-500">
                  No applications match your filters. Try adjusting your search or clear to see all.
                </p>
              )}
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <div
                key={application.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                  <div className="flex items-start gap-4">
                    <CompanyLogo
                      companyLogo={application.job.employer.companyLogo}
                      companyName={application.job.employer.companyName}
                      size="md"
                      className="shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <Link href={`/user/jobs/${application.job.id}`}>
                        <h3 className="text-xl font-semibold hover:text-blue-600">
                          {application.job.title}
                        </h3>
                      </Link>
                      <p className="mt-1 text-gray-600">
                        {application.job.employer.companyName}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {formatLocation(application.job.location)}
                        </Badge>
                        <Badge variant="outline">
                          {application.job.category}
                        </Badge>
                        {(application.job.status === "PAUSED" ||
                          application.job.status === "CLOSED" ||
                          application.job.status === "INACTIVE") && (
                          <Badge variant="secondary" className="text-xs">
                            {application.job.status === "PAUSED"
                              ? "Job paused"
                              : application.job.status === "CLOSED"
                                ? "Job closed"
                                : "Job deactivated"}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Applied on{" "}
                        {new Date(application.appliedAt).toLocaleDateString()}
                      </p>
                      {application.coverLetter && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                          {application.coverLetter}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        application.status === "SHORTLISTED"
                          ? "default"
                          : application.status === "REJECTED"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {application.status}
                    </Badge>
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
