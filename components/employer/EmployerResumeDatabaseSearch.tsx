"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Mail, MapPin, Briefcase, CalendarDays, Upload, HelpCircle } from "lucide-react";
import SkillTagInput from "@/components/common/SkillTagInput";

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

        const res = await fetch(`/api/employer/resume-search?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch resumes");
        const data: FetchResult = await res.json();
        setResumes(data.resumes ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? 1);
      } catch (err: any) {
        setError(err.message || "Failed to load database search results");
        setResumes([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const formattedSkills = isBooleanSearch ? booleanSkillsExpr : skills.join(",");
    fetchResumes(
      page,
      appliedKeyword,
      formattedSkills,
      appliedIsBooleanSearch,
      appliedLocation,
      appliedMinExperience,
      appliedMaxExperience
    );
  }, [
    page,
    appliedKeyword,
    appliedSkills,
    appliedIsBooleanSearch,
    appliedLocation,
    appliedMinExperience,
    appliedMaxExperience,
    refreshCount,
    fetchResumes,
  ]);

  const apply = () => {
    setAppliedKeyword(keyword);
    setAppliedLocation(location);
    setAppliedMinExperience(minExperience);
    setAppliedMaxExperience(maxExperience);
    setAppliedIsBooleanSearch(isBooleanSearch);
    if (isBooleanSearch) {
      setAppliedSkills(booleanSkillsExpr);
    } else {
      setAppliedSkills(skills.join(","));
    }
    setPage(1);
    setRefreshCount((prev) => prev + 1);
  };

  const clear = () => {
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

      {/* Indeed-Style Combined Search Box */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-8 overflow-hidden transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 items-stretch">
          {/* Keywords / Role Search */}
          <div className="flex-1 p-5 flex items-center gap-3">
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">What</label>
              <input
                type="text"
                placeholder="Job title, keywords, name or email..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                className="w-full bg-transparent border-0 p-0 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>

          {/* Location Search */}
          <div className="flex-1 p-5 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Where</label>
              <input
                type="text"
                placeholder="City, state, or country..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                className="w-full bg-transparent border-0 p-0 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>

          {/* Skills Search */}
          <div className="flex-1 p-5 flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="employer-boolean-search-toggle"
                    checked={isBooleanSearch}
                    onChange={(e) => setIsBooleanSearch(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="employer-boolean-search-toggle" className="text-[9px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none">
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
                  className="w-full bg-transparent border-0 p-0 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                />
              ) : (
                <SkillTagInput
                  value={skills}
                  onChange={setSkills}
                  placeholder="React, Node.js..."
                  className="w-full border-0 p-0 shadow-none bg-transparent hover:bg-transparent focus:bg-transparent"
                />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Min Experience</span>
              <input
                type="number"
                min={0}
                placeholder="Min Yrs"
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Max Experience</span>
              <input
                type="number"
                min={0}
                placeholder="Max Yrs"
                value={maxExperience}
                onChange={(e) => setMaxExperience(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              onClick={clear}
              className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-650 hover:bg-slate-100 transition-all active:scale-95"
            >
              Reset Filters
            </Button>
            <Button
              onClick={apply}
              className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95"
            >
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
          <Button
            variant="ghost"
            className="h-10 px-6 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous Page
          </Button>
          <span className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-500 shadow-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            className="h-10 px-6 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next Page
          </Button>
        </div>
      )}
    </div>
  );
}
