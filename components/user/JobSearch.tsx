"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { formatLocation, formatSalary, stripHtml } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import { CheckCircle2, Search } from "lucide-react";
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
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { data: session } = useSession();
  const activeRequestRef = useRef<AbortController | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [candSkills, setCandSkills] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("desc");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedTitle, setAppliedTitle] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedSort, setAppliedSort] = useState("desc");
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const appliedSet = useMemo(() => new Set(appliedJobIds), [appliedJobIds]);

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

  const highlightText = (text: string, queries: string[]) => {
    if (!text || !queries || queries.length === 0) return text;
    const activeQueries = queries
      .map((q) => q.trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    if (activeQueries.length === 0) return text;

    const escaped = activeQueries.map((q) => escapeRegExp(q));
    const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = text.split(pattern);
    return (
      <>
        {parts.map((part, index) => {
          const isMatch = activeQueries.some((q) => q.toLowerCase() === part.toLowerCase());
          return isMatch ? (
            <mark key={index} className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold px-1.5 py-0.5 rounded text-[95%]">
              {part}
            </mark>
          ) : (
            part
          );
        })}
      </>
    );
  };

  const activeQueries = useMemo(() => {
    return [
      appliedSearch,
      appliedTitle,
      appliedCategory !== "all" ? appliedCategory : "",
      ...extractLocationTerms(appliedLocation),
    ].map((q) => q?.trim()).filter(Boolean);
  }, [appliedSearch, appliedTitle, appliedCategory, appliedLocation]);

  const updateUrl = (
    pageNum: number,
    searchVal: string,
    titleVal: string,
    categoryVal: string,
    locationVal: string,
    sortVal: string
  ) => {
    const params = new URLSearchParams();
    if (pageNum > 1) params.set("page", String(pageNum));
    if (searchVal.trim()) params.set("search", searchVal.trim());
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
      sortVal: string
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
        params.set("sort", sortVal);
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (titleVal.trim()) params.set("title", titleVal.trim());
        if (categoryVal && categoryVal !== "all")
          params.set("category", categoryVal);
        if (locationVal.trim())
          params.set("location", locationVal.trim());
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
    let titleVal = searchParams.get("title");
    let categoryVal = searchParams.get("category");
    let locationVal = searchParams.get("location");
    let sortVal = searchParams.get("sort");
    let pageValStr = searchParams.get("page");

    // If there are no searchParams in URL, check sessionStorage
    const hasParams = searchVal !== null || titleVal !== null || categoryVal !== null || locationVal !== null || sortVal !== null || pageValStr !== null;

    if (!hasParams && typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`jobs_browse_filters_${pathname}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          searchVal = parsed.search || "";
          titleVal = parsed.title || "";
          categoryVal = parsed.category || "all";
          locationVal = parsed.location || "";
          sortVal = parsed.sort || "desc";
          pageValStr = parsed.page ? String(parsed.page) : "1";

          // Update URL to match saved filters
          const params = new URLSearchParams();
          if (pageValStr && pageValStr !== "1") params.set("page", pageValStr);
          if (searchVal?.trim()) params.set("search", searchVal.trim());
          if (titleVal?.trim()) params.set("title", titleVal.trim());
          if (categoryVal && categoryVal !== "all") params.set("category", categoryVal);
          if (locationVal?.trim()) params.set("location", locationVal.trim());
          if (sortVal && sortVal !== "desc") params.set("sort", sortVal);
          const query = params.toString();
          router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
        } catch (e) {
          // ignore
        }
      }
    }

    const finalSearch = searchVal || "";
    const finalTitle = titleVal || "";
    const finalCategory = categoryVal || "all";
    const finalLocation = locationVal || "";
    const finalSort = sortVal || "desc";
    const finalPage = parseInt(pageValStr || "1", 10);

    setSearch(finalSearch);
    setTitle(finalTitle);
    setCategory(finalCategory);
    setLocation(finalLocation);
    setSort(finalSort);
    setPage(finalPage);

    setAppliedSearch(finalSearch);
    setAppliedTitle(finalTitle);
    setAppliedCategory(finalCategory);
    setAppliedLocation(finalLocation);
    setAppliedSort(finalSort);

    // Save to sessionStorage for future restoration if filters are active, or remove if clean
    const isClean = !finalSearch && !finalTitle && finalCategory === "all" && !finalLocation && finalSort === "desc" && finalPage === 1;

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

    fetchJobs(finalPage, finalSearch, finalTitle, finalCategory, finalLocation, finalSort);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams, pathname, router, fetchJobs]);

  const handleSearch = () => {
    const hasKeywords = search.trim().length > 0 || title.trim().length > 0;
    const hasOtherFilters = (category && category !== "all") || location.trim().length > 0;

    if (!hasKeywords && !hasOtherFilters) {
      handleClear();
    } else {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`jobs_browse_filters_${pathname}`);
        } catch (_e) {}
      }
      updateUrl(1, search, title, category, location, sort);
    }
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`jobs_browse_filters_${pathname}`);
      } catch (_e) {}
    }

    setSearch("");
    setTitle("");
    setCategory("all");
    setLocation("");
    setSort("desc");
    setPage(1);

    setAppliedSearch("");
    setAppliedTitle("");
    setAppliedCategory("all");
    setAppliedLocation("");
    setAppliedSort("desc");

    router.replace(pathname, { scroll: false });
    fetchJobs(1, "", "", "all", "", "desc");
  };

  const start = total === 0 ? 0 : (page - 1) * 10 + 1;
  const end = Math.min(page * 10, total);

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* Top clean filters block */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keyword Search</label>
            <Input
              placeholder="Search keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-blue-500/20 focus:border-blue-500 text-xs font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Title Search</label>
            <Input
              placeholder="Search job titles..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-blue-500/20 focus:border-blue-500 text-xs font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-850 focus:bg-white text-xs font-semibold">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-850 shadow-lg">
                <SelectItem value="all" className="text-xs font-semibold">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name} className="text-xs font-semibold">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By Date</label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-850 focus:bg-white text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-855 shadow-lg">
                <SelectItem value="desc" className="text-xs font-semibold">Latest First</SelectItem>
                <SelectItem value="asc" className="text-xs font-semibold">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location filters row */}
        <div className="pt-2 border-t border-slate-100">
          <LocationDropdown value={location} onChange={setLocation} />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="ghost" onClick={handleClear} loading={loading} className="h-10 px-5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 w-full md:w-auto shadow-sm">
            Reset
          </Button>
          <Button onClick={handleSearch} loading={loading} className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 w-full md:w-auto">
            <span style={{ color: "white" }}>Search Jobs</span>
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-semibold text-slate-500">
            <span className="font-bold text-slate-800">{total}</span> Jobs Found
            <span className="mx-3 text-slate-200">/</span>
            Showing {start} - {end}
          </p>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 mb-4" />
            <p className="text-xs font-semibold text-slate-500">Searching Jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-20 text-center shadow-sm">
            <div className="mx-auto h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-slate-200">
              <Search className="size-6 text-slate-300" />
            </div>
            <p className="text-xl font-bold text-slate-800 tracking-tight mb-2 italic">No Jobs Found</p>
            <p className="text-slate-400 text-xs font-medium italic mb-6 max-w-sm mx-auto">No jobs matched your search. Try adjusting your filters.</p>
            <Button variant="outline" onClick={handleClear} loading={loading} className="h-11 px-8 rounded-xl border-slate-200 hover:bg-slate-50 text-xs font-semibold transition-all">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job, idx) => (
              <div key={job.id}
                className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-md transition-all shadow-sm rounded-2xl p-6 sm:p-8 animate-in slide-in-from-right-10 duration-700 relative overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <CompanyLogo
                    companyLogo={job.employer.companyLogo}
                    companyName={job.companyName || job.employer.companyName}
                    size="md"
                    className="shrink-0 rounded-xl border border-slate-250 bg-white group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <Link href={getJobDetailUrl(job.id)}>
                        <h3 className="text-xl font-bold text-slate-800 hover:text-blue-600 transition-colors tracking-tight">
                          {highlightText(job.title, activeQueries)}
                        </h3>
                      </Link>
                      {appliedSet.has(job.id) && (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mx-auto md:mx-0 shadow-sm">
                          <CheckCircle2 className="size-3.5" />
                          Applied
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{job.companyName || job.employer.companyName}</p>

                    {/* Job Metadata Row */}
                    <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-xs font-semibold text-slate-450">
                      <span className="text-blue-600 font-bold">{`#JOB-${job.id.substring(0, 6).toUpperCase()}`}</span>
                      <span className="text-slate-300">|</span>
                      <span>Client: {job.companyName || job.employer.companyName}</span>
                      <span className="text-slate-300">|</span>
                      <span>Status: <span className="text-emerald-600 font-bold">Active</span></span>
                      <span className="text-slate-300">|</span>
                      <span>Recruiter: Tarun Upadhyay</span>
                    </div>

                    {/* Parse location JSON */}
                    {(() => {
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
                      return (
                        <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-2.5">
                          <span className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-650 whitespace-nowrap">
                            City: {highlightText(locationCity, activeQueries)}
                          </span>
                          <span className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-650 whitespace-nowrap">
                            State: {highlightText(locationState, activeQueries)}
                          </span>
                          <span className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-650 whitespace-nowrap">
                            {highlightText(job.category, activeQueries)}
                          </span>
                          <span className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-650 whitespace-nowrap">
                            {job.employmentType.replace("_", " ")}
                          </span>
                          {formatSalary(job) && (
                            <span className="px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                              {formatSalary(job)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    <p className="mt-4 line-clamp-2 text-sm font-medium text-slate-500 leading-relaxed">
                      {highlightText(stripHtml(job.description), activeQueries)}
                    </p>

                    {/* Match Score Bar */}
                    {job.matchScore !== undefined && job.matchScore !== null && (
                      <div className="mt-5 max-w-md p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-550 uppercase tracking-wider">
                            Profile Match
                          </span>
                          <span className={`text-xs font-bold ${job.matchScore >= 75
                              ? "text-emerald-600"
                              : job.matchScore >= 40
                                ? "text-amber-600"
                                : "text-blue-600"
                            }`}>
                            {job.matchScore}% Match
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${job.matchScore >= 75
                                ? "bg-emerald-500"
                                : job.matchScore >= 40
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                              }`}
                            style={{ width: `${job.matchScore}%` }}
                          />
                        </div>
                        {/* Matched Skills Preview */}
                        {(() => {
                          const jobSkills = Array.from(new Set([
                            ...(job.requiredSkills ?? []),
                            ...(job.secondarySkills ?? [])
                          ]));
                          if (jobSkills.length === 0) return null;
                          return (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {jobSkills.map((skill) => {
                                const isMatched = candSkills.some((cs) => matchSkill(cs, skill));
                                return (
                                  <span
                                    key={skill}
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all ${isMatched
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-250"
                                        : "bg-slate-50 text-slate-400 border-slate-200"
                                      }`}
                                  >
                                    {skill}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <ShareJobButton jobId={job.id} jobTitle={job.title} className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 text-slate-500 transition-all flex items-center justify-center shadow-sm" />
                        <div className="hidden sm:block border border-slate-200 bg-slate-50 px-3.5 py-1.5 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Posted On</p>
                          <p className="text-xs font-bold text-slate-650 mt-0.5">
                            {new Date(job.createdAt).toLocaleDateString()} at {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {/* Apply / Login / Details button */}
                      {appliedSet.has(job.id) ? (
                        /* Already applied: show green chip */
                        <span className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="size-4" />
                          Already Applied
                        </span>
                      ) : session?.user?.role === "JOB_SEEKER" ? (
                        /* Logged-in candidate: go to job detail with apply form */
                        <Link href={getJobDetailUrl(job.id)} className="w-full sm:w-auto">
                          <Button className="w-full sm:w-auto h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 border-0 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/10">
                            <span style={{ color: "white" }}>Apply Now</span>
                          </Button>
                        </Link>
                      ) : !session ? (
                        /* Guest: prompt login with callbackUrl so they land on apply page after auth */
                        <Link href={`/login?callbackUrl=${encodeURIComponent(getJobDetailUrl(job.id))}`} className="w-full sm:w-auto">
                          <Button className="w-full sm:w-auto h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 border-0 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/10">
                            <span style={{ color: "white" }}>Login to Apply</span>
                          </Button>
                        </Link>
                      ) : (
                        /* Employer / Admin / other roles: view details only */
                        <Link href={getJobDetailUrl(job.id)} className="w-full sm:w-auto">
                          <Button variant="ghost" className="w-full sm:w-auto h-11 px-8 rounded-xl text-xs font-semibold hover:bg-slate-50 border border-slate-200 text-slate-600 transition-all shadow-sm">
                            Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateUrl(Math.max(1, page - 1), appliedSearch, appliedTitle, appliedCategory, appliedLocation, appliedSort)}
              className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-450 hover:text-slate-700 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
            >
              ← Previous
            </Button>
            <div className="flex items-center gap-1.5">
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
                    <span key={`e-${i}`} className="px-2 text-slate-400">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant="ghost"
                      size="sm"
                      className={`h-9 w-9 p-0 rounded-xl text-xs font-semibold transition-all ${page === p
                          ? "bg-blue-600 text-white shadow-sm border border-blue-650"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-slate-200"
                        }`}
                      onClick={() => updateUrl(p, appliedSearch, appliedTitle, appliedCategory, appliedLocation, appliedSort)}
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
              onClick={() => updateUrl(Math.min(totalPages, page + 1), appliedSearch, appliedTitle, appliedCategory, appliedLocation, appliedSort)}
              className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-450 hover:text-slate-700 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
