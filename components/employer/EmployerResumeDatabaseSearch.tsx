"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Mail, MapPin, Briefcase, CalendarDays, Upload, HelpCircle } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import SkillTagInput from "@/components/common/SkillTagInput";
import Pagination from "@/components/common/Pagination";

interface ResumeRecord {
  id: string;
  originalFileName: string;
  r2Url: string;
  extractedName: string | null;
  extractedEmail: string | null;
  extractedLocation: string | null;
  currentTitle: string | null;
  experienceYears: number | null;
  skills: string[];
  createdAt: string;
}

interface FetchResult {
  resumes: ResumeRecord[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export default function EmployerResumeDatabaseSearch({
  searchParams: initialParams,
  resumeUploadEnabled,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
  resumeUploadEnabled: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [keyword, setKeyword] = useState((initialParams.keyword as string) || "");
  const [skills, setSkills] = useState<string[]>(
    (initialParams.skills as string)?.split(",").filter(Boolean) || []
  );
  const [isBooleanSearch, setIsBooleanSearch] = useState(false);
  const [booleanSkillsExpr, setBooleanSkillsExpr] = useState("");
  const [location, setLocation] = useState((initialParams.location as string) || "");
  const [minExperience, setMinExperience] = useState(
    (initialParams.minExperience as string) || ""
  );
  const [maxExperience, setMaxExperience] = useState(
    (initialParams.maxExperience as string) || ""
  );

  const [appliedKeyword, setAppliedKeyword] = useState(keyword);
  const [appliedSkills, setAppliedSkills] = useState<string>((initialParams.skills as string) || "");
  const [appliedIsBooleanSearch, setAppliedIsBooleanSearch] = useState(false);
  const [appliedLocation, setAppliedLocation] = useState(location);
  const [appliedMinExperience, setAppliedMinExperience] = useState(minExperience);
  const [appliedMaxExperience, setAppliedMaxExperience] = useState(maxExperience);

  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);
  const limit = 12;

  const updateUrl = useCallback(
    (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
      locationVal: string,
      minExpVal: string,
      maxExpVal: string
    ) => {
      const params = new URLSearchParams();
      if (pageNum > 1) params.set("page", String(pageNum));
      if (keywordVal.trim()) params.set("keyword", keywordVal.trim());
      if (skillsVal.trim()) params.set("skills", skillsVal.trim());
      if (locationVal.trim()) params.set("location", locationVal.trim());
      if (minExpVal.trim()) params.set("minExperience", minExpVal.trim());
      if (maxExpVal.trim()) params.set("maxExperience", maxExpVal.trim());
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  // Upload States
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const onUpload = async () => {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    setUploadMessage("");

    const CLIENT_BATCH_SIZE = 10;
    const totalBatches = Math.ceil(files.length / CLIENT_BATCH_SIZE);
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalFiles = 0;
    const failedFilesList: Array<{ name: string; error: string }> = [];

    try {
      for (let i = 0; i < files.length; i += CLIENT_BATCH_SIZE) {
        const batchFiles = files.slice(i, i + CLIENT_BATCH_SIZE);
        const batchNum = Math.floor(i / CLIENT_BATCH_SIZE) + 1;
        setUploadMessage(
          totalBatches > 1
            ? `Uploading batch ${batchNum}/${totalBatches} (files ${i + 1}–${Math.min(i + CLIENT_BATCH_SIZE, files.length)} of ${files.length})… please wait`
            : `Uploading ${files.length} file${files.length !== 1 ? "s" : ""}… please wait`
        );

        const formData = new FormData();
        batchFiles.forEach((file) => formData.append("files", file));
        const res = await fetch("/api/employer/resume-search/bulk-upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Request failed");
        }
        const result = await res.json();
        totalFiles += result.totalFiles;
        totalSuccess += result.successCount;
        totalFailed += result.failedCount;

        if (result.createdDocs && Array.isArray(result.createdDocs)) {
          result.createdDocs.forEach((doc: any) => {
            if (doc.parseStatus === "FAILED") {
              failedFilesList.push({
                name: doc.originalFileName,
                error: doc.parseError || "Unknown error",
              });
            }
          });
        }
      }

      let msg = `✅ Done! Uploaded ${totalFiles} files: ${totalSuccess} parsed, ${totalFailed} failed.`;
      if (failedFilesList.length > 0) {
        msg += "\n\nFailed files:\n" + failedFilesList.map((f) => `• ${f.name}: ${f.error}`).join("\n");
      }
      setUploadMessage(msg);
      setFiles([]);
      setRefreshCount((prev) => prev + 1);
      setPage(1);
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Bulk upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const activeRequestRef = useRef<AbortController | null>(null);

  const fetchResumes = useCallback(
    async (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
      isBooleanSearchVal: boolean,
      locationVal: string,
      minExpVal: string,
      maxExpVal: string
    ) => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
      const controller = new AbortController();
      activeRequestRef.current = controller;

      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(limit));
        if (keywordVal.trim()) params.set("keyword", keywordVal.trim());
        if (skillsVal.trim()) params.set("skills", skillsVal.trim());
        if (isBooleanSearchVal) params.set("isBooleanSearch", "true");
        if (locationVal.trim()) params.set("location", locationVal.trim());
        if (minExpVal.trim()) params.set("minExperience", minExpVal.trim());
        if (maxExpVal.trim()) params.set("maxExperience", maxExpVal.trim());

        const res = await fetch(`/api/employer/resume-search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch resumes");
        const data: FetchResult = await res.json();

        if (controller.signal.aborted) return;

        setResumes(data.resumes ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? pageNum);
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setError(err.message || "Failed to load database search results");
        setResumes([]);
        setTotal(0);
        setTotalPages(1);
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

  // Sync with URL searchParams and sessionStorage
  useEffect(() => {
    let kw = getParam("keyword");
    let sk = getParam("skills");
    let loc = getParam("location");
    let minExp = getParam("minExperience");
    let maxExp = getParam("maxExperience");
    let pageValStr = getParam("page");

    const hasParams =
      kw !== null ||
      sk !== null ||
      loc !== null ||
      minExp !== null ||
      maxExp !== null ||
      pageValStr !== null;

    const storageKey = `employer_resume_db_filters_${pathname}`;

    if (!hasParams && typeof window !== "undefined") {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          kw = parsed.keyword || "";
          sk = parsed.skills || "";
          loc = parsed.location || "";
          minExp = parsed.minExperience || "";
          maxExp = parsed.maxExperience || "";
          pageValStr = parsed.page ? String(parsed.page) : "1";

          const params = new URLSearchParams();
          if (pageValStr && pageValStr !== "1") params.set("page", pageValStr);
          if (kw?.trim()) params.set("keyword", kw.trim());
          if (sk?.trim()) params.set("skills", sk.trim());
          if (loc?.trim()) params.set("location", loc.trim());
          if (minExp?.trim()) params.set("minExperience", minExp.trim());
          if (maxExp?.trim()) params.set("maxExperience", maxExp.trim());
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
    const finalMinExp = minExp || "";
    const finalMaxExp = maxExp || "";
    const finalPage = parseInt(pageValStr || "1", 10);

    setKeyword(finalKw);
    setSkills(finalSk ? finalSk.split(",").filter(Boolean) : []);
    setLocation(finalLoc);
    setMinExperience(finalMinExp);
    setMaxExperience(finalMaxExp);
    setPage(finalPage);

    setAppliedKeyword(finalKw);
    setAppliedSkills(finalSk);
    setAppliedLocation(finalLoc);
    setAppliedMinExperience(finalMinExp);
    setAppliedMaxExperience(finalMaxExp);

    const isClean =
      !finalKw &&
      !finalSk &&
      !finalLoc &&
      !finalMinExp &&
      !finalMaxExp &&
      finalPage === 1;

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
              minExperience: finalMinExp,
              maxExperience: finalMaxExp,
              page: finalPage,
            })
          );
        } catch (_e) {}
      }
    }

    fetchResumes(
      finalPage,
      finalKw,
      finalSk,
      appliedIsBooleanSearch,
      finalLoc,
      finalMinExp,
      finalMaxExp
    );
  }, [searchParams, pathname, router, refreshCount, appliedIsBooleanSearch, fetchResumes, getParam]);

  const [resetting, setResetting] = useState(false);

  const apply = () => {
    const formattedSkills = isBooleanSearch ? booleanSkillsExpr : skills.join(",");
    const hasInputs = keyword.trim().length > 0 || formattedSkills.trim().length > 0 || location.trim().length > 0 || minExperience.trim().length > 0 || maxExperience.trim().length > 0;
    if (!hasInputs) {
      clear();
    } else {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`employer_resume_db_filters_${pathname}`);
        } catch (_e) {}
      }
      updateUrl(1, keyword, formattedSkills, location, minExperience, maxExperience);
    }
  };

  const clear = async () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`employer_resume_db_filters_${pathname}`);
      } catch (_e) {}
    }

    setResetting(true);
    setKeyword("");
    setSkills([]);
    setIsBooleanSearch(false);
    setBooleanSkillsExpr("");
    setLocation("");
    setMinExperience("");
    setMaxExperience("");
    setAppliedKeyword("");
    setAppliedSkills("");
    setAppliedIsBooleanSearch(false);
    setAppliedLocation("");
    setAppliedMinExperience("");
    setAppliedMaxExperience("");
    setPage(1);

    router.replace(pathname, { scroll: false });
    await fetchResumes(1, "", "", false, "", "", "");
    setResetting(false);
  };

  const rangeText = useMemo(() => {
    if (total === 0) return "Showing 0 results";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `Showing ${start}-${end} of ${total}`;
  }, [limit, page, total]);

  return (
    <div className="w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1.5">Talent Database</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Resume Library</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Access the central resume database. Filter by candidate details, location, and key skills.</p>
        </div>
      </div>

      {/* Bulk Upload Widget */}
      {resumeUploadEnabled && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 flex flex-col gap-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Upload className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-800">Add Resumes to Library</h3>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="h-14 opacity-0 absolute inset-0 z-10 cursor-pointer w-full"
              />
              <div className="h-14 w-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-emerald-400 transition-colors">
                <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-slate-400" />
                  {files.length > 0 ? `${files.length} FILES SELECTED` : "DRAG & DROP OR CLICK TO CHOOSE RESUME FILES (PDF/DOC)"}
                </p>
              </div>
            </div>
            <Button
              onClick={onUpload}
              disabled={uploading || files.length === 0}
              className="h-14 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              <span style={{ color: "white" }}>
                {uploading ? "Uploading..." : "Upload & Parse"}
              </span>
            </Button>
          </div>

          {uploadMessage && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-650 text-xs font-semibold whitespace-pre-wrap">
              <span className="font-bold text-slate-800 uppercase tracking-wider block mb-1">Process Log:</span>
              {uploadMessage}
            </div>
          )}
        </div>
      )}

      {/* Redesigned Search Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm mb-8 flex flex-col gap-6 transition-all duration-300 hover:shadow-md hover:border-slate-300">
        {/* Top 3 Search Fields Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* What Search */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              What
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Job title, keywords, name or email..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                className="h-11 w-full rounded-xl bg-slate-50/80 border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Where Search */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              Where
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="City, state, or country..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                className="h-11 w-full rounded-xl bg-slate-50/80 border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Skills Search */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                Skills
              </label>
              <div className="flex items-center gap-1.5 bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/60">
                <input
                  type="checkbox"
                  id="employer-boolean-search-toggle"
                  checked={isBooleanSearch}
                  onChange={(e) => setIsBooleanSearch(e.target.checked)}
                  className="h-3 w-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="employer-boolean-search-toggle" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer select-none">
                  Boolean
                </label>
              </div>
            </div>
            {isBooleanSearch ? (
              <input
                type="text"
                placeholder="e.g. java AND (react OR angular)"
                value={booleanSkillsExpr}
                onChange={(e) => setBooleanSkillsExpr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                className="h-11 w-full rounded-xl bg-slate-50/80 border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
              />
            ) : (
              <SkillTagInput
                value={skills}
                onChange={setSkills}
                placeholder="React, Node.js..."
                className="w-full"
              />
            )}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
              Experience (Years)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min Yrs"
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                className="h-10 w-24 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
              />
              <span className="text-slate-300 font-bold text-xs">-</span>
              <input
                type="number"
                min={0}
                placeholder="Max Yrs"
                value={maxExperience}
                onChange={(e) => setMaxExperience(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                className="h-10 w-24 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              onClick={clear}
              loading={resetting}
              className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-650 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
            >
              Reset Filters
            </Button>
            <Button
              onClick={apply}
              loading={loading && !resetting}
              className="h-11 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/15 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              {!loading && <Search className="h-4 w-4 text-white" />}
              <span style={{ color: "white" }}>Find Resumes</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Results Header Metadata */}
      {!loading && resumes.length > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {rangeText}
          </span>
        </div>
      )}

      {/* Candidates List Results */}
      <div className="grid gap-6">
        {loading ? (
          <div className="rounded-2xl p-24 text-center border border-slate-200 bg-white shadow-sm animate-pulse">
            <p className="text-sm font-semibold text-slate-400 italic">Accessing Resume Archives...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-center font-semibold text-sm">
            Error: {error}
          </div>
        ) : resumes.length === 0 ? (
          <div className="rounded-2xl p-24 text-center border border-slate-200 bg-white shadow-sm">
            <p className="text-sm font-semibold text-slate-450">
              No matching records found in the database.
            </p>
          </div>
        ) : (
          resumes.map((resume, idx) => (
            <div
              key={resume.id}
              className="bg-white border-l-4 border-l-emerald-500 border border-slate-200 group flex flex-col justify-between gap-5 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 animate-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1 min-w-0 space-y-3.5">
                  {/* Title & Name */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                      {resume.extractedName || "Unknown Name"}
                    </h3>
                    <p className="text-sm font-bold text-emerald-700 mt-1">
                      {resume.currentTitle || "Role Not Specified"}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {resume.extractedEmail || "No Email Provided"}
                    </span>
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {resume.extractedLocation || "Remote"}
                    </span>
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      {resume.experienceYears != null ? `${resume.experienceYears} Years Exp` : "Experience Not Specified"}
                    </span>
                  </div>

                  {/* Skills Grid */}
                  {resume.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {resume.skills.map((skill) => {
                        let isMatched = false;
                        if (isBooleanSearch) {
                          const terms = (booleanSkillsExpr.match(/AND|OR|NOT|\(|\)|"[^"]+"|[^\s()]+/gi) || [])
                            .map(t => t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t)
                            .filter(t => {
                              const u = t.toUpperCase();
                              return u !== 'AND' && u !== 'OR' && u !== 'NOT' && t !== '(' && t !== ')';
                            })
                            .map(t => t.toLowerCase());
                          isMatched = terms.some(t => skill.toLowerCase().includes(t) || t.includes(skill.toLowerCase()));
                        } else {
                          isMatched = skills.some(s => s.toLowerCase() === skill.toLowerCase() || skill.toLowerCase().includes(s.toLowerCase()));
                        }
                        return (
                          <span
                            key={`${resume.id}-${skill}`}
                            className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                              isMatched
                                ? "bg-emerald-600 border-emerald-500 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-650"
                            }`}
                          >
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Side Action Box */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 lg:gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-0 border-slate-100">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-300" />
                    Added: {new Date(resume.createdAt).toLocaleDateString()}
                  </span>
                  <a
                    href={resume.r2Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 flex items-center text-xs font-bold text-slate-700 transition-all shadow-sm shrink-0 uppercase tracking-wider"
                  >
                    View Resume PDF
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => updateUrl(p, appliedKeyword, appliedSkills, appliedLocation, appliedMinExperience, appliedMaxExperience)}
        loading={loading}
      />
    </div>
  );
}
