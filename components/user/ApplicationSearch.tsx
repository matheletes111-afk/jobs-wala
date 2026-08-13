"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Pagination from "@/components/common/Pagination";

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
    companyName: string;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeRequestRef = useRef<AbortController | null>(null);

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

  const updateUrl = useCallback(
    (
      pageNum: number,
      searchVal: string,
      categoryVal: string,
      locationVal: string,
      statusVal: string
    ) => {
      const params = new URLSearchParams();
      if (pageNum > 1) params.set("page", String(pageNum));
      if (searchVal.trim()) params.set("search", searchVal.trim());
      if (categoryVal && categoryVal !== "all") params.set("category", categoryVal);
      if (locationVal.trim()) params.set("location", locationVal.trim());
      if (statusVal && statusVal !== "all") params.set("status", statusVal);
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  const getJobDetailUrl = (jobId: string) => {
    const params = new URLSearchParams();
    params.set("from", pathname);
    if (page > 1) params.set("page", String(page));
    if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
    if (appliedCategory && appliedCategory !== "all") params.set("category", appliedCategory);
    if (appliedLocation.trim()) params.set("location", appliedLocation.trim());
    if (appliedStatus && appliedStatus !== "all") params.set("status", appliedStatus);
    const query = params.toString();
    return `/jobs/${jobId}${query ? `?${query}` : ""}`;
  };

  const fetchApplications = useCallback(
    async (
      pageNum: number,
      searchVal: string,
      categoryVal: string,
      locationVal: string,
      statusVal: string
    ) => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
      const controller = new AbortController();
      activeRequestRef.current = controller;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", "10");
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (categoryVal && categoryVal !== "all")
          params.set("category", categoryVal);
        if (locationVal.trim())
          params.set("location", locationVal.trim());
        if (statusVal && statusVal !== "all") params.set("status", statusVal);
        const res = await fetch(`/api/user/applications?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data: FetchResult = await res.json();

        if (controller.signal.aborted) return;

        setApplications(data.applications ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? pageNum);
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setApplications([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
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

  // Sync state with searchParams (URL) and sessionStorage
  useEffect(() => {
    let searchVal = searchParams.get("search");
    let categoryVal = searchParams.get("category");
    let locationVal = searchParams.get("location");
    let statusVal = searchParams.get("status");
    let pageValStr = searchParams.get("page");

    const hasParams =
      searchVal !== null ||
      categoryVal !== null ||
      locationVal !== null ||
      statusVal !== null ||
      pageValStr !== null;

    if (!hasParams && typeof window !== "undefined") {
      const saved = sessionStorage.getItem("user_applications_filters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          searchVal = parsed.search || "";
          categoryVal = parsed.category || "all";
          locationVal = parsed.location || "";
          statusVal = parsed.status || "all";
          pageValStr = parsed.page ? String(parsed.page) : "1";

          const params = new URLSearchParams();
          if (pageValStr && pageValStr !== "1") params.set("page", pageValStr);
          if (searchVal?.trim()) params.set("search", searchVal.trim());
          if (categoryVal && categoryVal !== "all") params.set("category", categoryVal);
          if (locationVal?.trim()) params.set("location", locationVal.trim());
          if (statusVal && statusVal !== "all") params.set("status", statusVal);
          const query = params.toString();
          router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
        } catch (_e) {}
      }
    }

    const finalSearch = searchVal || "";
    const finalCategory = categoryVal || "all";
    const finalLocation = locationVal || "";
    const finalStatus = statusVal || "all";
    const finalPage = parseInt(pageValStr || "1", 10);

    setSearch(finalSearch);
    setCategory(finalCategory);
    setLocation(finalLocation);
    setStatus(finalStatus);
    setPage(finalPage);

    setAppliedSearch(finalSearch);
    setAppliedCategory(finalCategory);
    setAppliedLocation(finalLocation);
    setAppliedStatus(finalStatus);

    const isClean =
      !finalSearch &&
      finalCategory === "all" &&
      !finalLocation &&
      finalStatus === "all" &&
      finalPage === 1;

    if (typeof window !== "undefined") {
      if (isClean) {
        try {
          sessionStorage.removeItem("user_applications_filters");
        } catch (_e) {}
      } else {
        try {
          sessionStorage.setItem(
            "user_applications_filters",
            JSON.stringify({
              search: finalSearch,
              category: finalCategory,
              location: finalLocation,
              status: finalStatus,
              appliedSearch: finalSearch,
              appliedCategory: finalCategory,
              appliedLocation: finalLocation,
              appliedStatus: finalStatus,
              page: finalPage,
            })
          );
        } catch (_e) {}
      }
    }

    fetchApplications(
      finalPage,
      finalSearch,
      finalCategory,
      finalLocation,
      finalStatus
    );
  }, [searchParams, pathname, router, fetchApplications]);

  const handleSearch = () => {
    const hasSearch = search.trim().length > 0;
    const hasOtherFilters = (category && category !== "all") || location.trim().length > 0 || (status && status !== "all");

    if (!hasSearch && !hasOtherFilters) {
      handleClear();
    } else {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("user_applications_filters");
        } catch (_e) {}
      }
      updateUrl(1, search, category, location, status);
    }
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("user_applications_filters");
      } catch (_e) {}
    }

    setSearch("");
    setCategory("all");
    setLocation("");
    setStatus("all");
    setAppliedSearch("");
    setAppliedCategory("all");
    setAppliedLocation("");
    setAppliedStatus("all");
    setPage(1);

    router.replace(pathname, { scroll: false });
    fetchApplications(1, "", "all", "", "all");
  };

  const start = total === 0 ? 0 : (page - 1) * 10 + 1;
  const end = Math.min(page * 10, total);

  return (
    <div className="flex flex-col gap-6">
      {/* Top clean filters block */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keywords</label>
            <Input
              placeholder="Job title or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-blue-500/20 focus:border-blue-500 text-xs font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:bg-white text-xs font-semibold">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-800 shadow-lg">
                <SelectItem value="all" className="text-xs font-semibold">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name} className="text-xs font-semibold">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location filters row */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
          <LocationDropdown value={location} onChange={setLocation} />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          {/* Status filters row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "PENDING", "REVIEWED", "SHORTLISTED", "REJECTED"] as const).map((s) => (
              <Button
                key={s}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus(s);
                  setAppliedStatus(s);
                  setPage(1);
                }}
                disabled={loading}
                className={`h-8 px-3.5 text-xs font-semibold rounded-lg border transition-all ${
                  appliedStatus === s
                    ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                    : "text-slate-650 border-slate-100 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {s === "all" ? "All Statuses" : s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <Button variant="ghost" onClick={handleClear} loading={loading} className="h-10 px-5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 w-full md:w-auto shadow-sm">
              Reset
            </Button>
            <Button onClick={handleSearch} loading={loading} className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 w-full md:w-auto">
              <span style={{ color: "white" }}>Search</span>
            </Button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-semibold text-slate-500">
            <span className="font-bold text-slate-800">{total}</span> Pipeline Items
            <span className="mx-3 text-slate-200">/</span>
            Result set {start} - {end}
          </p>
        </div>
        
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-t-transparent mb-4" />
            <p className="text-xs font-semibold text-slate-500">Synchronizing Applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center shadow-sm">
              {total === 0 && !appliedSearch && !appliedCategory && !appliedLocation && appliedStatus === "all" ? (
                <>
                  <p className="text-lg font-bold text-slate-800 mb-2.5">
                    Your pipeline is empty
                  </p>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                    Discover opportunities matched to your profile and start your next career move.
                  </p>
                  <Link href="/jobs/browse">
                    <Button className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all">
                      <span style={{ color: "white" }}>Explore Jobs Feed</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="max-w-sm mx-auto">
                  <p className="text-lg font-bold text-slate-800 mb-2.5">No matches found</p>
                  <p className="text-sm text-slate-500 mb-6">Try adjusting your filters or clearing them to see all applications.</p>
                  <Button variant="outline" onClick={handleClear} loading={loading} className="h-11 px-6 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-all">
                    Reset Selection
                  </Button>
                </div>
              )}
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application, idx) => (
              <div
                key={application.id}
                className="bg-white border border-slate-200 shadow-sm group rounded-2xl p-6 transition-all hover:border-blue-500/30 hover:shadow-md"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <CompanyLogo
                      companyLogo={application.job.employer.companyLogo}
                      companyName={application.job.companyName || application.job.employer.companyName}
                      size="md"
                      className="shrink-0 rounded-xl border border-slate-200 bg-white"
                    />
                    <div className="min-w-0 flex-1 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <Link href={getJobDetailUrl(application.job.id)}>
                          <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {application.job.title}
                          </h3>
                        </Link>
                        <span
                          className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all w-fit mx-auto md:mx-0 ${
                            application.status === "SHORTLISTED"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-250"
                              : application.status === "REJECTED"
                                ? "bg-red-50 text-red-650 border-red-250"
                                : "bg-blue-50 text-blue-600 border-blue-250"
                          }`}
                        >
                          {application.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {application.job.companyName || application.job.employer.companyName}
                      </p>
                      <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                        <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {formatLocation(application.job.location, true)}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {application.job.category}
                        </span>
                        {(application.job.status === "PAUSED" ||
                          application.job.status === "CLOSED" ||
                          application.job.status === "INACTIVE") && (
                          <span className="px-3 py-1 rounded-full bg-red-50 border border-red-150 text-xs font-semibold text-red-600 whitespace-nowrap">
                            {application.job.status.toLowerCase()}
                          </span>
                        )}
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs font-semibold text-slate-405">
                          Transmission Date <span className="text-slate-600 ml-1.5">{new Date(application.appliedAt).toLocaleDateString()}</span>
                        </p>
                        {application.coverLetter && (
                          <div className="group/note relative">
                            <p className="line-clamp-1 text-xs font-medium text-slate-500 italic max-w-md">
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
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => updateUrl(p, appliedSearch, appliedCategory, appliedLocation, appliedStatus)}
          loading={loading}
        />
      </div>
    </div>
  );
}
