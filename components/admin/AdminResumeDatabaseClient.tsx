"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Upload,
  FileText,
  MapPin,
  Mail,
  CalendarDays,
  CircleCheckBig,
  CircleX,
  Briefcase,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import SkillTagInput from "@/components/common/SkillTagInput";

type ParseStatus = "all" | "PENDING" | "PARSED" | "FAILED";

interface ResumeItem {
  id: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  r2Key: string;
  r2Url: string;
  parseStatus: "PENDING" | "PARSED" | "FAILED";
  parseError: string | null;
  extractedName: string | null;
  extractedEmail: string | null;
  extractedLocation: string | null;
  experienceYears: number | null;
  currentTitle: string | null;
  skills: string[];
  createdAt: string;
}

interface ResumeFetchResult {
  resumes: ResumeItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

interface BulkUploadResult {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  createdDocs?: Array<{
    originalFileName: string;
    parseStatus: string;
    parseError?: string | null;
  }>;
}

async function readApiError(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";
  const prefix = `HTTP ${res.status} (${contentType || "no-content-type"}) ${res.url}\n`;
  try {
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as { error?: string; details?: string };
      return prefix + (data.error || data.details || "Request failed");
    }
  } catch {
    // ignore
  }
  try {
    const text = await res.text();
    return prefix + text.slice(0, 200);
  } catch {
    return prefix + "Request failed";
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export default function AdminResumeDatabaseClient({
  searchParams: initialParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeRequestRef = useRef<AbortController | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [isBooleanSearch, setIsBooleanSearch] = useState(false);
  const [booleanSkillsExpr, setBooleanSkillsExpr] = useState("");
  const [location, setLocation] = useState("");
  const [parseStatus, setParseStatus] = useState<ParseStatus>("all");
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");

  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedSkills, setAppliedSkills] = useState("");
  const [appliedIsBooleanSearch, setAppliedIsBooleanSearch] = useState(false);
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedParseStatus, setAppliedParseStatus] = useState<ParseStatus>("all");
  const [appliedMinExperience, setAppliedMinExperience] = useState("");
  const [appliedMaxExperience, setAppliedMaxExperience] = useState("");

  const limit = 10;

  const updateUrl = useCallback(
    (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
      locationVal: string,
      parseStatusVal: ParseStatus,
      minExpVal: string,
      maxExpVal: string
    ) => {
      const params = new URLSearchParams();
      if (pageNum > 1) params.set("page", String(pageNum));
      if (keywordVal.trim()) params.set("keyword", keywordVal.trim());
      if (skillsVal.trim()) params.set("skills", skillsVal.trim());
      if (locationVal.trim()) params.set("location", locationVal.trim());
      if (parseStatusVal && parseStatusVal !== "all") params.set("parseStatus", parseStatusVal);
      if (minExpVal.trim()) params.set("minExperience", minExpVal.trim());
      if (maxExpVal.trim()) params.set("maxExperience", maxExpVal.trim());
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  const fetchResumes = useCallback(
    async (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
      isBooleanSearchVal: boolean,
      locationVal: string,
      parseStatusVal: ParseStatus,
      minExperienceVal: string,
      maxExperienceVal: string
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
        if (isBooleanSearchVal) params.set("isBooleanSearch", "true");
        if (locationVal.trim()) params.set("location", locationVal.trim());
        params.set("parseStatus", parseStatusVal);
        if (minExperienceVal.trim()) {
          params.set("minExperience", minExperienceVal.trim());
        }
        if (maxExperienceVal.trim()) {
          params.set("maxExperience", maxExperienceVal.trim());
        }

        const res = await fetch(`/api/admin/resume-database?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(await readApiError(res));
        const data: ResumeFetchResult = await res.json();

        if (controller.signal.aborted) return;

        setResumes(data.resumes ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? 1);
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
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

  // Sync state with searchParams (URL) and sessionStorage
  useEffect(() => {
    let kw = getParam("keyword");
    let sk = getParam("skills");
    let loc = getParam("location");
    let pStatus = getParam("parseStatus") as ParseStatus | null;
    let minExp = getParam("minExperience");
    let maxExp = getParam("maxExperience");
    let pageValStr = getParam("page");

    const hasParams =
      kw !== null ||
      sk !== null ||
      loc !== null ||
      pStatus !== null ||
      minExp !== null ||
      maxExp !== null ||
      pageValStr !== null;

    const storageKey = `admin_resume_db_filters_${pathname}`;

    if (!hasParams && typeof window !== "undefined") {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          kw = parsed.keyword || "";
          sk = parsed.skills || "";
          loc = parsed.location || "";
          pStatus = parsed.parseStatus || "all";
          minExp = parsed.minExperience || "";
          maxExp = parsed.maxExperience || "";
          pageValStr = parsed.page ? String(parsed.page) : "1";

          const params = new URLSearchParams();
          if (pageValStr && pageValStr !== "1") params.set("page", pageValStr);
          if (kw?.trim()) params.set("keyword", kw.trim());
          if (sk?.trim()) params.set("skills", sk.trim());
          if (loc?.trim()) params.set("location", loc.trim());
          if (pStatus && pStatus !== "all") params.set("parseStatus", pStatus);
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
    const finalPStatus: ParseStatus = pStatus || "all";
    const finalMinExp = minExp || "";
    const finalMaxExp = maxExp || "";
    const finalPage = parseInt(pageValStr || "1", 10);

    setKeyword(finalKw);
    setSkills(finalSk ? finalSk.split(",").filter(Boolean) : []);
    setLocation(finalLoc);
    setParseStatus(finalPStatus);
    setMinExperience(finalMinExp);
    setMaxExperience(finalMaxExp);
    setPage(finalPage);

    setAppliedKeyword(finalKw);
    setAppliedSkills(finalSk);
    setAppliedLocation(finalLoc);
    setAppliedParseStatus(finalPStatus);
    setAppliedMinExperience(finalMinExp);
    setAppliedMaxExperience(finalMaxExp);

    const isClean =
      !finalKw &&
      !finalSk &&
      !finalLoc &&
      finalPStatus === "all" &&
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
              parseStatus: finalPStatus,
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
      finalPStatus,
      finalMinExp,
      finalMaxExp
    );
  }, [searchParams, pathname, router, refreshCount, appliedIsBooleanSearch, fetchResumes, getParam]);

  const onApplyFilters = () => {
    const formattedSkills = isBooleanSearch ? booleanSkillsExpr : skills.join(",");
    const hasInputs = keyword.trim().length > 0 || formattedSkills.trim().length > 0 || location.trim().length > 0 || (parseStatus && parseStatus !== "all") || minExperience.trim().length > 0 || maxExperience.trim().length > 0;
    if (!hasInputs) {
      onClearFilters();
    } else {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`admin_resume_db_filters_${pathname}`);
        } catch (_e) {}
      }
      updateUrl(
        1,
        keyword,
        formattedSkills,
        location,
        parseStatus,
        minExperience,
        maxExperience
      );
    }
  };

  const onClearFilters = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`admin_resume_db_filters_${pathname}`);
      } catch (_e) {}
    }

    setKeyword("");
    setSkills([]);
    setIsBooleanSearch(false);
    setBooleanSkillsExpr("");
    setLocation("");
    setParseStatus("all");
    setMinExperience("");
    setMaxExperience("");
    setAppliedKeyword("");
    setAppliedSkills("");
    setAppliedIsBooleanSearch(false);
    setAppliedLocation("");
    setAppliedParseStatus("all");
    setAppliedMinExperience("");
    setAppliedMaxExperience("");
    setPage(1);

    router.replace(pathname, { scroll: false });
    fetchResumes(1, "", "", false, "", "all", "", "");
  };

  const onUpload = async () => {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    setMessage("");

    // Send files in client-side batches of 10 to avoid request body size limits
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
        setMessage(
          totalBatches > 1
            ? `Uploading batch ${batchNum}/${totalBatches} (files ${i + 1}–${Math.min(i + CLIENT_BATCH_SIZE, files.length)} of ${files.length})… please wait`
            : `Uploading ${files.length} file${files.length !== 1 ? "s" : ""}… please wait`
        );

        const formData = new FormData();
        batchFiles.forEach((file) => formData.append("files", file));
        const res = await fetch("/api/admin/resume-database/bulk-upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          throw new Error(await readApiError(res));
        }
        const result = (await res.json()) as BulkUploadResult;
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
      setMessage(msg);
      setFiles([]);
      await fetchResumes(
        1,
        appliedKeyword,
        appliedSkills,
        appliedIsBooleanSearch,
        appliedLocation,
        appliedParseStatus,
        appliedMinExperience,
        appliedMaxExperience
      );
      setPage(1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bulk upload failed.");
    } finally {
      setUploading(false);
    }
  };



  const onDeleteResume = async (id: string, fileName: string) => {
    if (loading || uploading) return;
    const confirmed = window.confirm(
      `Delete resume "${fileName}" from database? This action cannot be undone.`
    );
    if (!confirmed) return;

    setMessage("");
    try {
      const res = await fetch(`/api/admin/resume-database?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      setMessage(`Successfully deleted resume "${fileName}".`);
      setRefreshCount((prev) => prev + 1);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete resume."
      );
    }
  };

  const rangeText = useMemo(() => {
    if (total === 0) return "Showing 0 results";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `Showing ${start}-${end} of ${total}`;
  }, [limit, page, total]);

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Admin Panel</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resume <span className="text-blue-600">Database</span></h1>
          <p className="text-sm font-medium text-slate-500">Bulk upload, parse, and search candidate resumes across the platform.</p>
        </div>

        {/* Upload Card */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="h-11 opacity-0 absolute inset-0 z-10 cursor-pointer w-full"
              />
              <div className="h-11 w-full flex items-center gap-3 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/40 hover:bg-blue-50 px-4 transition-all">
                <Upload className="h-4 w-4 text-blue-400 shrink-0" />
                <p className="text-xs font-semibold text-slate-500">
                  {files.length > 0 ? `${files.length} file${files.length !== 1 ? "s" : ""} selected` : "Click to select resumes (PDF, DOC, DOCX)"}
                </p>
              </div>
            </div>
            <Button
              onClick={onUpload}
              disabled={uploading || files.length === 0}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Upload className="mr-2 h-3.5 w-3.5 text-white" />
              <span className="text-white">{uploading ? "Uploading..." : "Upload & Parse"}</span>
            </Button>
          </div>

          {message && (
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium animate-in slide-in-from-top-2 whitespace-pre-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Upload Log</span>
              {message}
            </div>
          )}
        </div>

        {/* Filter Card */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Search Filters</span>
            <span className="ml-auto text-[11px] font-semibold text-slate-400 tabular-nums">{rangeText}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* Keyword */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keyword</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Name, email, title..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills</label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    id="boolean-search-toggle"
                    checked={isBooleanSearch}
                    onChange={(e) => setIsBooleanSearch(e.target.checked)}
                    className="h-3 w-3 rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Boolean</span>
                </label>
              </div>
              {isBooleanSearch ? (
                <input
                  type="text"
                  placeholder="java AND react OR laravel"
                  value={booleanSkillsExpr}
                  onChange={(e) => setBooleanSkillsExpr(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all"
                />
              ) : (
                <SkillTagInput
                  value={skills}
                  onChange={setSkills}
                  placeholder="React, Java, Python..."
                  className="w-full"
                />
              )}
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="City, state, country..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Parse Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
              <Select value={parseStatus} onValueChange={(val) => setParseStatus(val as ParseStatus)}>
                <SelectTrigger className="h-10 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:border-blue-500/50">
                  <SelectValue placeholder="All Resumes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resumes</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARSED">Parsed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Experience Range */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> Exp Range (Yrs)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all text-center"
                />
                <span className="text-slate-400 font-bold text-xs shrink-0">–</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={maxExperience}
                  onChange={(e) => setMaxExperience(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all text-center"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <Button
              onClick={onApplyFilters}
              loading={loading}
              className="h-9 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-95"
            >
              <span className="text-white">Apply Filters</span>
            </Button>
            <Button
              variant="ghost"
              onClick={onClearFilters}
              loading={loading}
              className="h-9 px-5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              <span>Reset</span>
            </Button>
          </div>
        </div>

        {/* Results Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-500 animate-pulse">Loading Resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="py-20 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No resumes found matching your filters.</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="divide-y-0 flex flex-col gap-3 p-4">
              {resumes.map((resume, idx) => {
                const statusStyles = {
                  PARSED: "bg-emerald-50 text-emerald-600 border-emerald-200",
                  FAILED: "bg-red-50 text-red-600 border-red-200",
                  PENDING: "bg-amber-50 text-amber-600 border-amber-200",
                };
                return (
                  <div
                    key={resume.id}
                    className="group flex flex-col sm:flex-row sm:items-start gap-5 bg-white border border-slate-200 rounded-2xl px-6 py-5 hover:border-blue-300 hover:shadow-md shadow-sm transition-all animate-in fade-in duration-500"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Left: Identity */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {resume.extractedName || "Unknown Candidate"}
                        </h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusStyles[resume.parseStatus]}`}>
                          {resume.parseStatus === "PARSED" ? <CircleCheckBig className="h-3 w-3" /> : resume.parseStatus === "FAILED" ? <CircleX className="h-3 w-3" /> : null}
                          {resume.parseStatus}
                        </span>
                        {resume.currentTitle && (
                          <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-600">
                            {resume.currentTitle}
                          </span>
                        )}
                        {resume.experienceYears != null && (
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {resume.experienceYears}Y Exp
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <Mail className="h-3 w-3 text-slate-400" />{resume.extractedEmail || "N/A"}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <MapPin className="h-3 w-3 text-slate-400" />{resume.extractedLocation || "N/A"}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                          <CalendarDays className="h-3 w-3" />{new Date(resume.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-[10px] font-semibold text-slate-400 truncate">
                        {resume.originalFileName} &middot; {formatBytes(resume.sizeBytes)}
                      </p>

                      {resume.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {resume.skills.slice(0, 12).map((skill) => {
                            const isMatched = isBooleanSearch
                              ? (booleanSkillsExpr.match(/AND|OR|NOT|\(|\)|"[^"]+"|[^\s()]+/gi) || [])
                                  .map(t => (t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t))
                                  .filter(t => { const u = t.toUpperCase(); return u !== 'AND' && u !== 'OR' && u !== 'NOT' && t !== '(' && t !== ')'; })
                                  .map(t => t.toLowerCase())
                                  .some(t => skill.toLowerCase().includes(t) || t.includes(skill.toLowerCase()))
                              : skills.some(s => s.toLowerCase() === skill.toLowerCase() || skill.toLowerCase().includes(s.toLowerCase()));
                            return (
                              <span
                                key={`${resume.id}-${skill}`}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                                  isMatched
                                    ? "bg-blue-600 text-white border-blue-500"
                                    : "bg-slate-50 border-slate-200 text-slate-600"
                                }`}
                              >
                                {skill}
                              </span>
                            );
                          })}
                          {resume.skills.length > 12 && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-50 border border-slate-200 text-slate-400">
                              +{resume.skills.length - 12}
                            </span>
                          )}
                        </div>
                      )}

                      {resume.parseStatus === "FAILED" && resume.parseError && (
                        <div className="mt-1 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[10px] font-semibold">
                          {resume.parseError}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <Link
                        href={resume.r2Url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-all"
                      >
                        <ExternalLink className="h-3 w-3" /> View
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => onDeleteResume(resume.id, resume.originalFileName)}
                        className="h-8 px-3 rounded-lg text-[11px] font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 tabular-nums">{rangeText}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition-all"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold text-slate-600 tabular-nums px-3">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition-all"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
