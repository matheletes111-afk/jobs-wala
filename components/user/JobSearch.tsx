"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { formatSalary, stripHtml } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import {
  CheckCircle2,
  Search,
  LayoutGrid,
  List,
  MapPin,
  Briefcase,
  Clock,
  Sparkles,
  CheckSquare,
  Square,
  Zap,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import ShareJobButton from "@/components/ShareJobButton";
import CompanyLogo from "@/components/CompanyLogo";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { matchSkill } from "@/lib/skill-match";

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
  companyName?: string | null;
  createdAt: string;
  matchScore?: number | null;
  requiredSkills?: string[];
  secondarySkills?: string[];
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
  candidateSkills?: string[];
}

export default function JobSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [candSkills, setCandSkills] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Multi-select & Bulk Apply states (for Candidate role only)
  const isCandidate = session?.user?.role === "JOB_SEEKER";
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Expandable job card state (BUG-21: Compact initial footprint, expand on click)
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);
  const toggleExpandJob = (jobId: string) => {
    setExpandedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"all" | "title" | "skill" | "company">("all");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("desc");

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedSearchType, setAppliedSearchType] = useState<"all" | "title" | "skill" | "company">("all");
  const [appliedTitle, setAppliedTitle] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedSort, setAppliedSort] = useState("desc");
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const appliedSet = useMemo(() => new Set(appliedJobIds), [appliedJobIds]);
  const activeRequestRef = useRef<AbortController | null>(null);

  // Unapplied jobs on current page (can be selected)
  const unappliedPageJobs = useMemo(
    () => jobs.filter((j) => !appliedSet.has(j.id)),
    [jobs, appliedSet]
  );

  // Toggle single job selection
  const toggleJobSelect = (jobId: string) => {
    if (appliedSet.has(jobId)) return;
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  // Toggle select all unapplied jobs on current page
  const toggleSelectAllOnPage = () => {
    const unappliedIds = unappliedPageJobs.map((j) => j.id);
    if (unappliedIds.length === 0) return;
    const allSelected = unappliedIds.every((id) => selectedJobIds.includes(id));
    if (allSelected) {
      setSelectedJobIds((prev) => prev.filter((id) => !unappliedIds.includes(id)));
    } else {
      setSelectedJobIds((prev) => Array.from(new Set([...prev, ...unappliedIds])));
    }
  };

  const deselectAllJobs = () => {
    setSelectedJobIds([]);
  };

  // 1-Click Bulk Apply
  const handleBulkApply = async () => {
    if (selectedJobIds.length === 0 || bulkApplying) return;
    setBulkApplying(true);
    setApplyFeedback(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: selectedJobIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "PROFILE_INCOMPLETE") {
          setApplyFeedback({
            type: "error",
            message: `⚠️ ${data.error || "Please complete your profile before applying."} (${data.details || ""})`,
          });
        } else {
          setApplyFeedback({
            type: "error",
            message: `❌ ${data.error || "Failed to submit applications."}`,
          });
        }
        return;
      }

      // Success
      if (data.appliedJobIds && Array.isArray(data.appliedJobIds)) {
        setAppliedJobIds((prev) => Array.from(new Set([...prev, ...data.appliedJobIds])));
      }
      setSelectedJobIds([]);
      setApplyFeedback({
        type: "success",
        message: `🎉 ${data.message || `Successfully applied to ${selectedJobIds.length} job roles!`}`,
      });
    } catch (err: any) {
      setApplyFeedback({
        type: "error",
        message: `❌ ${err?.message || "An unexpected error occurred while applying."}`,
      });
    } finally {
      setBulkApplying(false);
    }
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const extractLocationTerms = (locationStr: string): string[] => {
    if (!locationStr || !locationStr.trim()) return [];
    try {
      const parsed = JSON.parse(decodeURIComponent(locationStr));
      const terms: string[] = [];
      if (parsed.country) terms.push(parsed.country);
      if (parsed.state) {
        if (Array.isArray(parsed.state)) terms.push(...parsed.state);
        else if (typeof parsed.state === "string") terms.push(parsed.state);
      }
      if (parsed.city) {
        if (Array.isArray(parsed.city)) terms.push(...parsed.city);
        else if (typeof parsed.city === "string") terms.push(parsed.city);
      }
      return terms.map((t) => t.trim()).filter(Boolean);
    } catch {
      return [locationStr.trim()];
    }
  };

  const activeQueries = useMemo(() => {
    const locTerms = extractLocationTerms(appliedLocation);
    return [
      appliedSearch,
      appliedTitle,
      appliedCategory === "all" ? "" : appliedCategory,
      ...locTerms,
    ]
      .map((q) => q?.trim())
      .filter(Boolean);
  }, [appliedSearch, appliedTitle, appliedCategory, appliedLocation]);

  const highlightText = (text: string | null | undefined, queries: string[]) => {
    if (!text) return "";
    const validQueries = queries.filter(Boolean);
    if (validQueries.length === 0) return text;

    const pattern = validQueries.map((q) => escapeRegExp(q)).join("|");
    if (!pattern) return text;

    const parts = text.split(new RegExp(`(${pattern})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          validQueries.some((q) => q.toLowerCase() === part.toLowerCase()) ? (
            <mark
              key={i}
              className="bg-yellow-200 text-slate-900 rounded px-1 py-0.5 font-bold"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const parseLocationDisplay = (locStr: string) => {
    let city = "";
    let state = "";
    let country = "India";
    try {
      const parsed = JSON.parse(locStr);
      if (parsed.city && Array.isArray(parsed.city) && parsed.city.length > 0) {
        city = parsed.city[0];
      } else if (parsed.city && typeof parsed.city === "string") {
        city = parsed.city;
      }
      if (parsed.state && Array.isArray(parsed.state) && parsed.state.length > 0) {
        state = parsed.state[0];
      } else if (parsed.state && typeof parsed.state === "string") {
        state = parsed.state;
      }
      if (parsed.country) country = parsed.country;
    } catch {
      const parts = (locStr || "").split(",");
      city = parts[0]?.trim() || "";
      state = parts[1]?.trim() || "";
    }

    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return country || "India";
  };

  const updateUrl = (
    pageNum: number,
    searchVal: string,
    titleVal: string,
    categoryVal: string,
    locationVal: string,
    sortVal: string,
    searchTypeVal: string = "all"
  ) => {
    const params = new URLSearchParams();
    if (pageNum > 1) params.set("page", String(pageNum));
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (searchTypeVal && searchTypeVal !== "all") params.set("searchType", searchTypeVal);
    if (titleVal.trim()) params.set("title", titleVal.trim());
    if (categoryVal && categoryVal !== "all") params.set("category", categoryVal);
    if (locationVal.trim()) params.set("location", locationVal.trim());
    if (sortVal && sortVal !== "desc") params.set("sort", sortVal);
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  const getJobDetailUrl = (jobId: string) => {
    const params = new URLSearchParams();
    params.set("from", pathname);
    if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
    if (appliedSearchType !== "all") params.set("searchType", appliedSearchType);
    if (appliedTitle.trim()) params.set("title", appliedTitle.trim());
    if (appliedCategory && appliedCategory !== "all") params.set("category", appliedCategory);
    if (appliedLocation.trim()) params.set("location", appliedLocation.trim());
    if (appliedSort && appliedSort !== "desc") params.set("sort", appliedSort);
    const query = params.toString();
    return `/jobs/${jobId}${query ? `?${query}` : ""}`;
  };

  const fetchJobs = useCallback(
    async (
      pageNum: number,
      searchVal: string,
      titleVal: string,
      categoryVal: string,
      locationVal: string,
      sortVal: string,
      searchTypeVal: string = "all"
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
        params.set("limit", "12");
        params.set("sort", sortVal);
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (searchTypeVal && searchTypeVal !== "all") params.set("searchType", searchTypeVal);
        if (titleVal.trim()) params.set("title", titleVal.trim());
        if (categoryVal && categoryVal !== "all") params.set("category", categoryVal);
        if (locationVal.trim()) params.set("location", locationVal.trim());

        const res = await fetch(`/api/user/jobs?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data: FetchResult = await res.json();

        if (controller.signal.aborted) return;

        setJobs(data.jobs ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? pageNum);
        setAppliedJobIds(data.appliedJobIds ?? []);
        setCandSkills(data.candidateSkills ?? []);
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setJobs([]);
        setTotal(0);
        setTotalPages(0);
        setAppliedJobIds([]);
        setCandSkills([]);
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

  useEffect(() => {
    let searchVal = searchParams.get("search");
    let searchTypeVal = (searchParams.get("searchType") || "all") as "all" | "title" | "skill" | "company";
    let titleVal = searchParams.get("title");
    let categoryVal = searchParams.get("category");
    let locationVal = searchParams.get("location");
    let sortVal = searchParams.get("sort");
    let pageValStr = searchParams.get("page");

    const hasParams =
      searchVal !== null ||
      titleVal !== null ||
      categoryVal !== null ||
      locationVal !== null ||
      sortVal !== null ||
      pageValStr !== null;

    if (!hasParams && typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`jobs_browse_filters_${pathname}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          searchVal = parsed.search || "";
          searchTypeVal = (parsed.searchType || "all") as "all" | "title" | "skill" | "company";
          titleVal = parsed.title || "";
          categoryVal = parsed.category || "all";
          locationVal = parsed.location || "";
          sortVal = parsed.sort || "desc";
          pageValStr = parsed.page ? String(parsed.page) : "1";

          const params = new URLSearchParams();
          if (pageValStr && pageValStr !== "1") params.set("page", pageValStr);
          if (searchVal?.trim()) params.set("search", searchVal.trim());
          if (searchTypeVal !== "all") params.set("searchType", searchTypeVal);
          if (titleVal?.trim()) params.set("title", titleVal.trim());
          if (categoryVal && categoryVal !== "all") params.set("category", categoryVal);
          if (locationVal?.trim()) params.set("location", locationVal.trim());
          if (sortVal && sortVal !== "desc") params.set("sort", sortVal);
          const query = params.toString();
          router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
        } catch (_e) {}
      }
    }

    const finalSearch = searchVal || "";
    const finalSearchType = searchTypeVal || "all";
    const finalTitle = titleVal || "";
    const finalCategory = categoryVal || "all";
    const finalLocation = locationVal || "";
    const finalSort = sortVal || "desc";
    const finalPage = parseInt(pageValStr || "1", 10);

    setSearch(finalSearch);
    setSearchType(finalSearchType);
    setTitle(finalTitle);
    setCategory(finalCategory);
    setLocation(finalLocation);
    setSort(finalSort);
    setPage(finalPage);

    setAppliedSearch(finalSearch);
    setAppliedSearchType(finalSearchType);
    setAppliedTitle(finalTitle);
    setAppliedCategory(finalCategory);
    setAppliedLocation(finalLocation);
    setAppliedSort(finalSort);

    const isClean =
      !finalSearch &&
      finalSearchType === "all" &&
      !finalTitle &&
      finalCategory === "all" &&
      !finalLocation &&
      finalSort === "desc" &&
      finalPage === 1;

    if (typeof window !== "undefined") {
      if (isClean) {
        try {
          sessionStorage.removeItem(`jobs_browse_filters_${pathname}`);
        } catch (_e) {}
      } else {
        try {
          sessionStorage.setItem(
            `jobs_browse_filters_${pathname}`,
            JSON.stringify({
              search: finalSearch,
              searchType: finalSearchType,
              title: finalTitle,
              category: finalCategory,
              location: finalLocation,
              sort: finalSort,
              page: finalPage,
            })
          );
        } catch (_e) {}
      }
    }

    fetchJobs(finalPage, finalSearch, finalTitle, finalCategory, finalLocation, finalSort, finalSearchType);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams, pathname, router, fetchJobs]);

  const handleSearch = () => {
    const hasKeywords = search.trim().length > 0 || title.trim().length > 0;
    const hasOtherFilters = (category && category !== "all") || location.trim().length > 0;

    if (!hasKeywords && !hasOtherFilters && searchType === "all") {
      handleClear();
    } else {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`jobs_browse_filters_${pathname}`);
        } catch (_e) {}
      }
      updateUrl(1, search, title, category, location, sort, searchType);
    }
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`jobs_browse_filters_${pathname}`);
      } catch (_e) {}
    }

    setSearch("");
    setSearchType("all");
    setTitle("");
    setCategory("all");
    setLocation("");
    setSort("desc");
    setPage(1);

    setAppliedSearch("");
    setAppliedSearchType("all");
    setAppliedTitle("");
    setAppliedCategory("all");
    setAppliedLocation("");
    setAppliedSort("desc");

    router.replace(pathname, { scroll: false });
    fetchJobs(1, "", "", "all", "", "desc", "all");
  };

  const start = total === 0 ? 0 : (page - 1) * 12 + 1;
  const end = Math.min(page * 12, total);

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* Top Filter Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col gap-4">
        {/* Search dimension filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Search Dimension:
          </span>
          {(
            [
              { id: "all", label: "All Keywords" },
              { id: "title", label: "💼 Job Titles" },
              { id: "skill", label: "🏷️ Skills" },
              { id: "company", label: "🏢 Companies" },
            ] as const
          ).map((tab) => {
            const isSelected = searchType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSearchType(tab.id);
                  if (search.trim()) {
                    updateUrl(1, search, title, category, location, sort, tab.id);
                  }
                }}
                style={isSelected ? { color: "#ffffff", backgroundColor: "#2563eb", borderColor: "#2563eb" } : {}}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span style={{ color: isSelected ? "#ffffff" : "#475569" }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {searchType === "title"
                ? "Job Title"
                : searchType === "skill"
                ? "Skill"
                : searchType === "company"
                ? "Company Name"
                : "Keyword Search"}
            </label>
            <Input
              placeholder={
                searchType === "title"
                  ? "e.g. Full Stack Developer"
                  : searchType === "skill"
                  ? "e.g. React.js, Python"
                  : searchType === "company"
                  ? "e.g. Jobdaddy"
                  : "Search title, skills or company..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-blue-500/20 text-xs font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Job Title Filter
            </label>
            <Input
              placeholder="Filter by title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-blue-500/20 text-xs font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-700 focus:bg-white text-xs font-semibold">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg">
                <SelectItem value="all" className="text-xs font-semibold">
                  All Categories
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name} className="text-xs font-semibold">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Sort By Date
            </label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-700 focus:bg-white text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg">
                <SelectItem value="desc" className="text-xs font-semibold">
                  Latest First
                </SelectItem>
                <SelectItem value="asc" className="text-xs font-semibold">
                  Oldest First
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location Filters */}
        <div className="pt-2 border-t border-slate-100">
          <LocationDropdown value={location} onChange={setLocation} />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={handleClear}
            loading={loading}
            className="h-9 px-4 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 w-full sm:w-auto shadow-sm"
          >
            Reset
          </Button>
          <Button
            onClick={handleSearch}
            loading={loading}
            className="h-9 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 w-full sm:w-auto cursor-pointer"
          >
            <span style={{ color: "white" }}>Search Jobs</span>
          </Button>
        </div>
      </div>

      {/* Results Header & Grid/List View Switcher */}
      <div>
        {/* Application Feedback Alert */}
        {applyFeedback && (
          <div
            className={`mb-5 p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300 ${
              applyFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {applyFeedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              )}
              <p className="text-xs font-semibold">{applyFeedback.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setApplyFeedback(null)}
              className="p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-900">{total}</span> Jobs Found
              <span className="mx-2.5 text-slate-300">/</span>
              Showing {start} - {end}
            </p>

            {/* Candidate Role Multi-Select Toolbar Button */}
            {isCandidate && unappliedPageJobs.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllOnPage}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm"
              >
                {unappliedPageJobs.every((j) => selectedJobIds.includes(j.id)) ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400" />
                )}
                <span>Select All on Page ({unappliedPageJobs.length})</span>
              </button>
            )}

            {isCandidate && selectedJobIds.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {selectedJobIds.length} Selected
              </span>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm ml-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-blue-50 text-blue-600 font-bold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Grid View (More boxes visible)"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-blue-50 text-blue-600 font-bold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 mb-3" />
            <p className="text-xs font-semibold text-slate-500">Searching Jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-16 text-center shadow-sm">
            <div className="mx-auto h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-200">
              <Search className="size-6 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-800 tracking-tight mb-1">No Jobs Found</p>
            <p className="text-slate-400 text-xs font-medium mb-5 max-w-sm mx-auto">
              No jobs matched your search. Try adjusting your filters.
            </p>
            <Button
              variant="outline"
              onClick={handleClear}
              loading={loading}
              className="h-10 px-6 rounded-xl border-slate-200 hover:bg-slate-50 text-xs font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          /* High-Density Compact Grid View (BUG-21: Minimal vertical footprint initially, expand on click) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const locationDisplay = parseLocationDisplay(job.location);
              const jobSkills = Array.from(
                new Set([...(job.requiredSkills ?? []), ...(job.secondarySkills ?? [])])
              );
              const isApplied = appliedSet.has(job.id);
              const isSelected = selectedJobIds.includes(job.id);
              const isExpanded = expandedJobIds.includes(job.id);

              return (
                <div
                  key={job.id}
                  className={`bg-white border transition-all duration-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between group shadow-sm relative ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/20 shadow-md"
                      : "border-slate-200/90 hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div>
                    {/* Header: Checkbox + Company Logo + Company Name + Date + Share + Applied Badge */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isCandidate && !isApplied && (
                          <button
                            type="button"
                            onClick={() => toggleJobSelect(job.id)}
                            className="p-1 -ml-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                            aria-label={`Select job ${job.title}`}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4.5 w-4.5 text-blue-600" />
                            ) : (
                              <Square className="h-4.5 w-4.5 text-slate-300 group-hover:text-slate-400" />
                            )}
                          </button>
                        )}

                        <CompanyLogo
                          companyLogo={job.employer.companyLogo}
                          companyName={job.companyName || job.employer.companyName}
                          size="sm"
                          className="shrink-0 rounded-xl border border-slate-100 bg-white"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-600 truncate">
                            {job.companyName || job.employer.companyName}
                          </p>
                          <span className="text-[10px] font-medium text-slate-400">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isApplied && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="size-3" />
                            Applied
                          </span>
                        )}
                        <ShareJobButton
                          jobId={job.id}
                          jobTitle={job.title}
                          className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center"
                        />
                      </div>
                    </div>

                    {/* Job Title */}
                    <Link href={getJobDetailUrl(job.id)}>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2.5">
                        {highlightText(job.title, activeQueries)}
                      </h3>
                    </Link>

                    {/* Compact Key Attributes line: [Location] • [Employment Type] • [Exp] • [Budget/CTC] */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80">
                        <MapPin className="size-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[120px]">
                          {highlightText(locationDisplay, activeQueries)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80">
                        <Clock className="size-3 text-slate-400 shrink-0" />
                        <span>{job.employmentType.replace("_", " ")}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80">
                        <Briefcase className="size-3 text-slate-400 shrink-0" />
                        <span>{job.experienceRequired != null ? `${job.experienceRequired} Yrs` : "Exp N/A"}</span>
                      </span>
                      {formatSalary(job) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                          {formatSalary(job)}
                        </span>
                      )}
                    </div>

                    {/* Expandable Details Section (Skills, Match Score, Description Preview) */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Skills */}
                        {jobSkills.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Required Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {jobSkills.map((skill) => {
                                const isMatched = candSkills.some((cs) => matchSkill(cs, skill));
                                return (
                                  <span
                                    key={skill}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                      isMatched
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                                        : "bg-slate-50 text-slate-600 border-slate-200"
                                    }`}
                                  >
                                    {skill}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Profile Match Score */}
                        {job.matchScore !== undefined && job.matchScore !== null && (
                          <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg">
                            <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                              <Sparkles className="size-3 text-blue-500" />
                              Profile Match
                            </span>
                            <span
                              className={`font-bold ${
                                job.matchScore >= 75
                                  ? "text-emerald-600"
                                  : job.matchScore >= 40
                                  ? "text-amber-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {job.matchScore}%
                            </span>
                          </div>
                        )}

                        {/* Description Preview */}
                        {job.description && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">About Role</p>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                              {stripHtml(job.description)}
                            </p>
                          </div>
                        )}

                        <div>
                          <Link
                            href={getJobDetailUrl(job.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <span>View Full Job Posting</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Apply CTA & Expand Toggle */}
                  <div className="pt-3 border-t border-slate-100 mt-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      {isApplied ? (
                        <span className="w-full flex items-center justify-center gap-1.5 h-8.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="size-3.5" />
                          Applied
                        </span>
                      ) : session?.user?.role === "JOB_SEEKER" ? (
                        <Link href={getJobDetailUrl(job.id)} className="block w-full">
                          <Button className="w-full h-8.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm">
                            <span style={{ color: "white" }}>Apply Now</span>
                          </Button>
                        </Link>
                      ) : !session ? (
                        <Link
                          href={`/login?callbackUrl=${encodeURIComponent(getJobDetailUrl(job.id))}`}
                          className="block w-full"
                        >
                          <Button className="w-full h-8.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm">
                            <span style={{ color: "white" }}>Login to Apply</span>
                          </Button>
                        </Link>
                      ) : (
                        <Link href={getJobDetailUrl(job.id)} className="block w-full">
                          <Button
                            variant="ghost"
                            className="w-full h-8.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            Details
                          </Button>
                        </Link>
                      )}
                    </div>

                    {/* Expand/Collapse Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpandJob(job.id)}
                      className={`h-8.5 px-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isExpanded
                          ? "bg-blue-50 text-blue-600 border-blue-200"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                      aria-label={isExpanded ? "Collapse details" : "Expand details"}
                      title={isExpanded ? "Collapse details" : "Expand full details"}
                    >
                      <span>{isExpanded ? "Less" : "Details"}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Sleek Compact List View */
          <div className="space-y-3">
            {jobs.map((job) => {
              const locationDisplay = parseLocationDisplay(job.location);
              const jobSkills = Array.from(
                new Set([...(job.requiredSkills ?? []), ...(job.secondarySkills ?? [])])
              );
              const isApplied = appliedSet.has(job.id);
              const isSelected = selectedJobIds.includes(job.id);
              const isExpanded = expandedJobIds.includes(job.id);

              return (
                <div
                  key={job.id}
                  className={`bg-white border transition-all rounded-2xl p-4 sm:p-5 flex flex-col group ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/20 shadow-md"
                      : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Multi-Select Checkbox for candidate */}
                      {isCandidate && !isApplied && (
                        <button
                          type="button"
                          onClick={() => toggleJobSelect(job.id)}
                          className="p-1 -ml-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0 mt-0.5"
                          aria-label={`Select job ${job.title}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4.5 w-4.5 text-blue-600" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-slate-300 group-hover:text-slate-400" />
                          )}
                        </button>
                      )}

                      <CompanyLogo
                        companyLogo={job.employer.companyLogo}
                        companyName={job.companyName || job.employer.companyName}
                        size="sm"
                        className="shrink-0 rounded-xl border border-slate-100 bg-white mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Link href={getJobDetailUrl(job.id)}>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {highlightText(job.title, activeQueries)}
                            </h3>
                          </Link>
                          {isApplied && (
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="size-3" />
                              Applied
                            </span>
                          )}
                        </div>

                        {/* Compact Key Attributes line: [Company] • [Location] • [Employment Type] • [Exp] • [Budget/CTC] */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-medium">
                          <span className="font-bold text-slate-700">
                            {job.companyName || job.employer.companyName}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{highlightText(locationDisplay, activeQueries)}</span>
                          <span className="text-slate-300">•</span>
                          <span>{job.employmentType.replace("_", " ")}</span>
                          <span className="text-slate-300">•</span>
                          <span>{job.experienceRequired != null ? `${job.experienceRequired} Yrs` : "Exp N/A"}</span>
                          {formatSalary(job) && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-emerald-700 font-bold">{formatSalary(job)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side CTA, Share, & Expand Toggle */}
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <ShareJobButton
                        jobId={job.id}
                        jobTitle={job.title}
                        className="h-8.5 w-8.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center"
                      />
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="size-3.5" />
                          Applied
                        </span>
                      ) : session?.user?.role === "JOB_SEEKER" ? (
                        <Link href={getJobDetailUrl(job.id)}>
                          <Button className="h-8.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm">
                            <span style={{ color: "white" }}>Apply Now</span>
                          </Button>
                        </Link>
                      ) : !session ? (
                        <Link href={`/login?callbackUrl=${encodeURIComponent(getJobDetailUrl(job.id))}`}>
                          <Button className="h-8.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm">
                            <span style={{ color: "white" }}>Login to Apply</span>
                          </Button>
                        </Link>
                      ) : (
                        <Link href={getJobDetailUrl(job.id)}>
                          <Button
                            variant="ghost"
                            className="h-8.5 px-5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            Details
                          </Button>
                        </Link>
                      )}

                      {/* Expand Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleExpandJob(job.id)}
                        className={`h-8.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          isExpanded
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                        title={isExpanded ? "Collapse details" : "Expand full details"}
                      >
                        <span>{isExpanded ? "Less" : "Details"}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Accordion in List View */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div>
                        {job.description && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Job Description</p>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                              {stripHtml(job.description)}
                            </p>
                          </div>
                        )}
                        <div className="mt-2">
                          <Link
                            href={getJobDetailUrl(job.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <span>View Full Job Posting</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {jobSkills.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Required Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {jobSkills.map((skill) => {
                                const isMatched = candSkills.some((cs) => matchSkill(cs, skill));
                                return (
                                  <span
                                    key={skill}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                      isMatched
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                                        : "bg-slate-50 text-slate-600 border-slate-200"
                                    }`}
                                  >
                                    {skill}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {job.matchScore !== undefined && job.matchScore !== null && (
                          <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg">
                            <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                              <Sparkles className="size-3 text-blue-500" />
                              Profile Match
                            </span>
                            <span
                              className={`font-bold ${
                                job.matchScore >= 75
                                  ? "text-emerald-600"
                                  : job.matchScore >= 40
                                  ? "text-amber-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {job.matchScore}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Bulk Apply Action Bar (For Candidate Role) */}
        {isCandidate && selectedJobIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-full mx-auto">
            <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
              <span className="text-xs font-bold text-slate-200 whitespace-nowrap">
                {selectedJobIds.length} role{selectedJobIds.length !== 1 ? "s" : ""} selected
              </span>
            </div>

            {/* 1-Click Apply Button */}
            <Button
              size="sm"
              onClick={handleBulkApply}
              disabled={bulkApplying}
              className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>{bulkApplying ? "Applying..." : `Apply in 1-Click (${selectedJobIds.length})`}</span>
            </Button>

            {/* Deselect All */}
            <button
              type="button"
              onClick={deselectAllJobs}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Deselect all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() =>
                updateUrl(
                  Math.max(1, page - 1),
                  appliedSearch,
                  appliedTitle,
                  appliedCategory,
                  appliedLocation,
                  appliedSort,
                  appliedSearchType
                )
              }
              className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (page > 3 && page < totalPages - 2) {
                    p = page - 2 + i;
                  } else if (page >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  }
                }
                return (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "ghost"}
                    size="sm"
                    onClick={() =>
                      updateUrl(
                        p,
                        appliedSearch,
                        appliedTitle,
                        appliedCategory,
                        appliedLocation,
                        appliedSort,
                        appliedSearchType
                      )
                    }
                    className={`h-9 w-9 p-0 rounded-xl text-xs font-bold transition-all ${
                      page === p
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                        : "text-slate-500 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {p}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() =>
                updateUrl(
                  Math.min(totalPages, page + 1),
                  appliedSearch,
                  appliedTitle,
                  appliedCategory,
                  appliedLocation,
                  appliedSort,
                  appliedSearchType
                )
              }
              className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
