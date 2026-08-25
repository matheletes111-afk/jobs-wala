"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { formatLocation, formatPhoneForCsv } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import { Search, User, MapPin, Briefcase, GraduationCap, FileText, ChevronRight, LayoutGrid, List, Download } from "lucide-react";
import CandidateAvatar from "@/components/CandidateAvatar";
import Pagination from "@/components/common/Pagination";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  location?: string | null;
  experience?: number | null;
  skills: string[];
  profileImage?: string | null;
  resumeUrl?: string | null;
  resumeUpdatedAt?: string | null;
  education?: string | null;
  bio?: string | null;
  availabilityStatus?: string | null;
  phone?: string | null;
  certificates?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  user: { email: string };
}

interface FetchResult {
  candidates: Candidate[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export default function ResumeSearch({
  searchParams: initialParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  const pathname = usePathname();

  const searchParams = useSearchParams();
  const activeRequestRef = useRef<AbortController | null>(null);

  const [keyword, setKeyword] = useState((initialParams.keyword as string) || "");
  const [skills, setSkills] = useState((initialParams.skills as string) || "");
  const [location, setLocation] = useState((initialParams.location as string) || "");
  const [appliedKeyword, setAppliedKeyword] = useState(
    (initialParams.keyword as string) || ""
  );
  const [appliedSkills, setAppliedSkills] = useState(
    (initialParams.skills as string) || ""
  );
  const [appliedLocation, setAppliedLocation] = useState(
    (initialParams.location as string) || ""
  );
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const limit = 12;

  const updateUrl = useCallback(
    (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
      locationVal: string
    ) => {
      const params = new URLSearchParams();
      if (pageNum > 1) params.set("page", String(pageNum));
      if (keywordVal.trim()) params.set("keyword", keywordVal.trim());
      if (skillsVal.trim()) params.set("skills", skillsVal.trim());
      if (locationVal.trim()) params.set("location", locationVal.trim());
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  const getCandidateDetailUrl = (candidateId: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (appliedKeyword.trim()) params.set("keyword", appliedKeyword.trim());
    if (appliedSkills.trim()) params.set("skills", appliedSkills.trim());
    if (appliedLocation.trim()) params.set("location", appliedLocation.trim());
    const query = params.toString();
    return `/employer/candidates/${candidateId}${query ? `?${query}` : ""}`;
  };

  const fetchCandidates = useCallback(
    async (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
      locationVal: string
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
        params.set("limit", String(limit));
        if (keywordVal.trim()) params.set("keyword", keywordVal.trim());
        if (skillsVal.trim()) params.set("skills", skillsVal.trim());
        if (locationVal.trim()) params.set("location", locationVal.trim());
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data: FetchResult = await res.json();

        if (controller.signal.aborted) return;

        setCandidates(data.candidates ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? pageNum);
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setCandidates([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [limit]
  );

  const getParam = useCallback(
    (key: string): string | null => {
      const fromHook = searchParams.get(key);
      if (fromHook !== null) return fromHook;
      if (initialParams && typeof initialParams[key] === "string") {
        return initialParams[key] as string;
      }
      return null;
    },
    [searchParams, initialParams]
  );

  // Sync state with searchParams (URL) and sessionStorage
  useEffect(() => {
    let kw = getParam("keyword");
    let sk = getParam("skills");
    let loc = getParam("location");
    let pageValStr = getParam("page");

    const hasParams = kw !== null || sk !== null || loc !== null || pageValStr !== null;
    const storageKey = `employer_candidate_search_filters_${pathname}`;

    if (!hasParams && typeof window !== "undefined") {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          kw = parsed.keyword || "";
          sk = parsed.skills || "";
          loc = parsed.location || "";
          pageValStr = parsed.page ? String(parsed.page) : "1";

          const params = new URLSearchParams();
          if (pageValStr && pageValStr !== "1") params.set("page", pageValStr);
          if (kw?.trim()) params.set("keyword", kw.trim());
          if (sk?.trim()) params.set("skills", sk.trim());
          if (loc?.trim()) params.set("location", loc.trim());
          const query = params.toString();
          if (query) {
            router.replace(`${pathname}?${query}`, { scroll: false });
          }
        } catch (_e) {}
      }
    }

    const finalKw = kw || "";
    const finalSk = sk || "";
    const finalLoc = loc || "";
    const finalPage = parseInt(pageValStr || "1", 10);

    setKeyword(finalKw);
    setSkills(finalSk);
    setLocation(finalLoc);
    setPage(finalPage);

    setAppliedKeyword(finalKw);
    setAppliedSkills(finalSk);
    setAppliedLocation(finalLoc);

    const isClean = !finalKw && !finalSk && !finalLoc && finalPage === 1;

    if (typeof window !== "undefined") {
      if (isClean) {
        try {
          sessionStorage.removeItem(storageKey);
        } catch (_e) {}
      } else {
        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify({
              keyword: finalKw,
              skills: finalSk,
              location: finalLoc,
              appliedKeyword: finalKw,
              appliedSkills: finalSk,
              appliedLocation: finalLoc,
              page: finalPage,
            })
          );
        } catch (_e) {}
      }
    }

    fetchCandidates(finalPage, finalKw, finalSk, finalLoc);
  }, [searchParams, pathname, router, fetchCandidates, getParam]);

  const handleSearch = () => {
    const hasInputs = keyword.trim().length > 0 || skills.trim().length > 0 || location.trim().length > 0;
    if (!hasInputs) {
      handleClear();
    } else {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`employer_candidate_search_filters_${pathname}`);
        } catch (_e) {}
      }
      updateUrl(1, keyword, skills, location);
    }
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`employer_candidate_search_filters_${pathname}`);
      } catch (_e) {}
    }

    setKeyword("");
    setSkills("");
    setLocation("");
    setAppliedKeyword("");
    setAppliedSkills("");
    setAppliedLocation("");
    setPage(1);

    router.replace(pathname, { scroll: false });
    fetchCandidates(1, "", "", "");
  };

  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async (applyFilters: boolean) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("export", "true");
      if (applyFilters) {
        if (appliedKeyword.trim()) params.set("keyword", appliedKeyword.trim());
        if (appliedSkills.trim()) params.set("skills", appliedSkills.trim());
        if (appliedLocation.trim()) params.set("location", appliedLocation.trim());
      }
      
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch candidates for export");
      const data = await res.json();
      const exportCandidates = data.candidates ?? [];
      
      if (exportCandidates.length === 0) {
        alert("No candidates found to export.");
        return;
      }
      
      const headers = [
        "Candidate ID", "First Name", "Last Name", "Email", "Phone", "Job Title", 
        "Location", "Experience (Years)", "Skills", "Education", 
        "Availability", "Bio", "Resume URL", "Resume Updated At",
        "Certificates", "Profile Created", "Profile Updated"
      ];
      const rows = exportCandidates.map((candidate: any) => [
        candidate.id,
        `"${candidate.firstName.replace(/"/g, '""')}"`,
        `"${candidate.lastName.replace(/"/g, '""')}"`,
        `"${(candidate.user?.email || "").replace(/"/g, '""')}"`,
        `"${formatPhoneForCsv(candidate.phone).replace(/"/g, '""')}"`,
        `"${(candidate.jobTitle || "").replace(/"/g, '""')}"`,
        `"${formatLocation(candidate.location).replace(/"/g, '""')}"`,
        candidate.experience ?? "",
        `"${(candidate.skills || []).join(", ").replace(/"/g, '""')}"`,
        `"${(candidate.education || "").replace(/"/g, '""')}"`,
        `"${(candidate.availabilityStatus || "").replace(/"/g, '""')}"`,
        `"${(candidate.bio || "").replace(/"/g, '""')}"`,
        `"${(candidate.resumeUrl || "").replace(/"/g, '""')}"`,
        candidate.resumeUpdatedAt ? new Date(candidate.resumeUpdatedAt).toISOString().split('T')[0] : "",
        `"${(candidate.certificates || "").replace(/"/g, '""')}"`,
        candidate.createdAt ? new Date(candidate.createdAt).toISOString().split('T')[0] : "",
        candidate.updatedAt ? new Date(candidate.updatedAt).toISOString().split('T')[0] : ""
      ]);
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${applyFilters ? "filtered_" : "all_"}candidates_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Failed to export candidates.");
    } finally {
      setExporting(false);
    }
  };

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const containerClass =
    "mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10";

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-slate-800">
      <div className={containerClass}>
        {/* Welcome Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/60 pb-6 animate-in fade-in duration-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">Candidate Search</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Explore Talent</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Filter by skills, location, and keywords to find matching candidates for your job openings.</p>
          </div>
          {!loading && candidates.length > 0 && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCSV(true)}
                disabled={exporting}
                className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-55 shadow-sm"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export Filtered"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCSV(false)}
                disabled={exporting}
                className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-55 shadow-sm"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export All"}
              </Button>
            </div>
          )}
        </div>

        {/* Clean Flat Filters Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 flex flex-col gap-5 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Keywords (e.g. name, title)..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-11 pl-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white text-xs font-medium text-slate-700"
              />
            </div>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Key Skills (e.g. React, Node)..."
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-11 pl-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white text-xs font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <LocationDropdown value={location} onChange={setLocation} />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              onClick={handleSearch}
              loading={loading}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 w-full md:w-auto"
            >
              <span style={{ color: "white" }}>Search</span>
            </Button>
            <Button
              variant="ghost"
              onClick={handleClear}
              loading={loading}
              className="h-11 px-5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 w-full md:w-auto"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Results Metadata & Toggle View */}
        {!loading && candidates.length > 0 && (
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Discovered {total} Candidate Profiles
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-2 transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:bg-slate-200"}`}
                aria-label="Grid Mode"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-lg p-2 transition-all ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:bg-slate-200"}`}
                aria-label="List Mode"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Candidates View */}
        <div className="w-full">
          {loading ? (
            <div className="rounded-2xl p-24 text-center border border-slate-200 bg-white shadow-sm animate-pulse">
              <p className="text-sm font-semibold text-slate-400 italic">Searching Candidates...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="rounded-2xl p-24 text-center border border-slate-200 bg-white shadow-sm">
              <p className="text-sm font-semibold text-slate-400">
                No candidates found. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
              {candidates.map((candidate, idx) => (
                <div
                  key={candidate.id}
                  className={`bg-white border border-slate-200 group flex flex-col rounded-2xl shadow-sm p-6 transition-all hover:shadow-md hover:border-blue-400/50 animate-in slide-in-from-bottom-2 duration-500 ${viewMode === "list" ? "md:flex-row md:items-center md:gap-10" : ""}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`flex items-start gap-4 ${viewMode === "list" ? "flex-1" : "mb-6"}`}>
                    <CandidateAvatar
                      profileImage={candidate.profileImage}
                      firstName={candidate.firstName}
                      lastName={candidate.lastName}
                      size="lg"
                      className="rounded-2xl border border-slate-200 shadow-sm transition-transform group-hover:scale-105"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                        <Link href={getCandidateDetailUrl(candidate.id)}>
                          {candidate.firstName} {candidate.lastName}
                        </Link>
                      </h3>
                      <p className="mb-2 text-xs font-semibold text-slate-400 truncate">
                        {candidate.user?.email || "No Email Provided"}
                      </p>
                      {candidate.availabilityStatus && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5">
                          <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                          {candidate.availabilityStatus}
                        </span>
                      )}
                      <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                        {candidate.jobTitle || "Job Title Not Specified"}
                      </p>
                    </div>
                  </div>

                  <div className={`flex-1 space-y-4 ${viewMode === "list" ? "hidden md:block" : ""}`}>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs leading-relaxed text-slate-500 font-medium italic line-clamp-2">
                        {candidate.bio ? `"${candidate.bio}"` : "Candidate profile contains high-value skills. View profile for more details."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 tabular-nums">
                      {candidate.location && (
                         <span className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" />
                          {formatLocation(candidate.location)}
                         </span>
                      )}
                      <span className="flex items-center gap-2">
                       <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                       {candidate.experience != null ? `${candidate.experience} YRS EXP` : "EXPERIENCED"}
                      </span>
                    </div>

                    {candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.slice(0, 3).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 3 && (
                          <span className="px-2 py-0.5 text-xs font-semibold text-slate-400">
                            +{candidate.skills.length - 3} MORE
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`pt-6 border-t border-slate-100 flex items-center justify-between gap-4 ${viewMode === "list" ? "border-t-0 pt-0" : "mt-6"}`}>
                    {candidate.resumeUrl ? (
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        VIEW RESUME
                      </a>
                    ) : (
                       <div className="hidden sm:flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                             <GraduationCap className="h-4 w-4 text-slate-400" />
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500 max-w-[120px] line-clamp-1">
                             {candidate.education || "EDUCATION"}
                          </p>
                       </div>
                    )}
                    <Link href={getCandidateDetailUrl(candidate.id)}>
                      <Button
                        variant="ghost"
                        className="h-9 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all group"
                      >
                        PROFILE
                        <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 text-slate-400" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => updateUrl(p, appliedKeyword, appliedSkills, appliedLocation)}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
