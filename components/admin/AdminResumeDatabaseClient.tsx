"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

export default function AdminResumeDatabaseClient() {
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
  const [location, setLocation] = useState("");
  const [parseStatus, setParseStatus] = useState<ParseStatus>("all");
  const [minExperience, setMinExperience] = useState("");

  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedSkills, setAppliedSkills] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedParseStatus, setAppliedParseStatus] = useState<ParseStatus>("all");
  const [appliedMinExperience, setAppliedMinExperience] = useState("");

  const limit = 10;

  const fetchResumes = useCallback(
    async (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
      locationVal: string,
      parseStatusVal: ParseStatus
      ,
      minExperienceVal: string
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(limit));
        if (keywordVal.trim()) params.set("keyword", keywordVal.trim());
        if (skillsVal.trim()) params.set("skills", skillsVal.trim());
        if (locationVal.trim()) params.set("location", locationVal.trim());
        params.set("parseStatus", parseStatusVal);
        if (minExperienceVal.trim()) {
          params.set("minExperience", minExperienceVal.trim());
        }

        const res = await fetch(`/api/admin/resume-database?${params.toString()}`);
        if (!res.ok) throw new Error(await readApiError(res));
        const data: ResumeFetchResult = await res.json();
        setResumes(data.resumes ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? 1);
      } catch {
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
    fetchResumes(
      page,
      appliedKeyword,
      appliedSkills,
      appliedLocation,
      appliedParseStatus
      ,
      appliedMinExperience
    );
  }, [
    page,
    appliedKeyword,
    appliedSkills,
    appliedLocation,
    appliedParseStatus,
    appliedMinExperience,
    fetchResumes,
    refreshCount,
  ]);

  const onApplyFilters = () => {
    setAppliedKeyword(keyword);
    setAppliedSkills(skills.join(","));
    setAppliedLocation(location);
    setAppliedParseStatus(parseStatus);
    setAppliedMinExperience(minExperience);
    setPage(1);
    setRefreshCount((prev) => prev + 1);
  };

  const onClearFilters = () => {
    setKeyword("");
    setSkills([]);
    setLocation("");
    setParseStatus("all");
    setMinExperience("");
    setAppliedKeyword("");
    setAppliedSkills("");
    setAppliedLocation("");
    setAppliedParseStatus("all");
    setAppliedMinExperience("");
    setPage(1);
  };

  const onUpload = async () => {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const res = await fetch("/api/admin/resume-database/bulk-upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      const result = (await res.json()) as BulkUploadResult;
      setMessage(
        `Uploaded ${result.totalFiles} files: ${result.successCount} parsed, ${result.failedCount} failed.`
      );
      setFiles([]);
      await fetchResumes(
        1,
        appliedKeyword,
        appliedSkills,
        appliedLocation,
        appliedParseStatus
        ,
        appliedMinExperience
      );
      setPage(1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bulk upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onDeleteFailed = async () => {
    if (loading || uploading) return;
    const confirmed = window.confirm(
      "Delete all FAILED resumes from database? This action cannot be undone."
    );
    if (!confirmed) return;

    setMessage("");
    try {
      const res = await fetch("/api/admin/resume-database", {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      const data = (await res.json()) as {
        deletedCount: number;
        deletedS3Objects: number;
      };
      setMessage(
        `Deleted ${data.deletedCount} failed resumes (${data.deletedS3Objects} file objects removed from storage).`
      );
      await fetchResumes(
        1,
        appliedKeyword,
        appliedSkills,
        appliedLocation,
        appliedParseStatus,
        appliedMinExperience
      );
      setPage(1);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete failed resumes."
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
    <div className="min-h-screen w-full bg-transparent text-foreground animate-in fade-in duration-1000">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:px-8 lg:px-10 lg:py-20">
        {/* Intelligence Header */}
        <div className="mb-20 border-b border-white/5 pb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
            <p className="text-xs font-semibold text-blue-500">Resume Database</p>
          </div>
          <h1 className="text-4xl font-bold md:text-6xl tracking-tighter text-white">
            Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Database</span>
          </h1>
          <p className="mt-4 text-lg font-medium text-muted-foreground/60 italic">
            Bulk upload and parse candidate resumes. Automatically extract contact information and skills.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-4 p-4 rounded-3xl bg-gradient-to-br from-blue-50 to-orange-50 border border-blue-200 shadow-sm backdrop-blur-3xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  className="h-14 opacity-0 absolute inset-0 z-10 cursor-pointer"
                />
                <div className="h-14 w-full flex items-center justify-center border-2 border-dashed border-blue-200 rounded-2xl bg-white/50 group hover:bg-white/80 transition-all">
                  <p className="text-xs font-semibold text-muted-foreground/60 group-hover:text-blue-500">
                    {files.length > 0 ? `${files.length} FILES SELECTED` : "SELECT RESUMES TO UPLOAD"}
                  </p>
                </div>
              </div>
              <Button
                onClick={onUpload}
                disabled={uploading || files.length === 0}
                className="h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Upload className="mr-3 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload & Parse"}
              </Button>
            </div>

            {message && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold italic animate-in slide-in-from-top-2">
                <span className="opacity-60">Log:</span> {message}
              </div>
            )}
          </div>
        </div>

        {/* Tactical Filters */}
        <div className="linear-card sticky top-32 rounded-[2.5rem] p-8 bg-gradient-to-br from-blue-50 to-orange-50 border border-blue-200 shadow-sm mb-12">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-sm font-semibold text-foreground">Search Filters</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <label className="text-xs font-semibold text-muted-foreground/40 italic flex items-center gap-2">
                <Search className="h-3 w-3" /> Keyword
              </label>
              <Input
                placeholder="Search name, email, title, text or skills..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                className="h-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground placeholder:text-muted-foreground/20 placeholder:text-[14px] placeholder:font-medium placeholder:tracking-normal"
              />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-semibold text-muted-foreground/40 italic flex items-center gap-2">
                <FileText className="h-3 w-3" /> Skills
              </label>
              <SkillTagInput
                value={skills}
                onChange={setSkills}
                placeholder="React, Java, Python..."
                className="w-full"
              />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-semibold text-muted-foreground/40 italic flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Location
              </label>
              <Input
                placeholder="Search by location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                className="h-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground placeholder:text-muted-foreground/20 placeholder:text-[14px] placeholder:font-medium placeholder:tracking-normal"
              />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-semibold text-muted-foreground/40 italic flex items-center gap-2">
                Parsing Status
              </label>
              <Select
                value={parseStatus}
                onValueChange={(val) => setParseStatus(val as ParseStatus)}
              >
                <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-background border-white/10">
                  <SelectItem value="all">All Resumes</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARSED">Parsed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-white/5 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button onClick={onApplyFilters} className="h-12 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all">
                Apply Filters
              </Button>
              <Button variant="ghost" onClick={onClearFilters} className="h-12 px-6 rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-white/5">
                Reset
              </Button>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-xs font-semibold text-muted-foreground/30 tabular-nums italic">{rangeText}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteFailed}
                disabled={loading || uploading}
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold hover:scale-105 transition-all"
              >
                Delete Failed Resumes
              </Button>
            </div>
          </div>
        </div>

        {/* Dossier Grid */}
        <div className="grid gap-6">
          {loading ? (
            <div className="linear-card rounded-[3rem] p-32 text-center animate-pulse">
              <p className="text-sm font-black uppercase tracking-[0.5em] text-blue-500">Loading Resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="linear-card rounded-[3rem] p-32 text-center border-dashed border-white/10">
              <p className="text-lg font-bold text-muted-foreground/40 italic leading-relaxed">
                No resumes found matching your filters.<br />Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            resumes.map((resume, idx) => (
              <div
                key={resume.id}
                className="linear-card group flex flex-col rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-orange-50 border border-blue-200 p-10 transition-all hover:shadow-md hover:border-blue-300 animate-in fade-in slide-in-from-bottom-5 duration-700"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex-1 min-w-0 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-blue-500/40 group-hover:text-blue-500 transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground/30 italic tabular-nums truncate">
                      {resume.originalFileName} {" // "} {formatBytes(resume.sizeBytes)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-foreground tracking-tighter group-hover:text-blue-500 transition-colors">
                      {resume.extractedName || "Unknown Candidate"}
                    </h3>
                    <div className="mt-4 flex flex-wrap items-center gap-6">
                      <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 italic">
                        <Mail className="h-3.5 w-3.5" />
                        {resume.extractedEmail || "N/A"}
                      </span>
                      <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 italic">
                        <MapPin className="h-3.5 w-3.5" />
                        {resume.extractedLocation || "N/A"}
                      </span>
                      <span className="text-xs font-semibold text-blue-500/80 px-3 py-1 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        {resume.currentTitle || "N/A"}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground/40 tabular-nums">
                        {resume.experienceYears != null ? `${resume.experienceYears}Y EXP` : "N/A"}
                      </span>
                    </div>
                  </div>

                  {resume.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.map((skill) => {
                        const isMatched = skills.some(s => s.toLowerCase() === skill.toLowerCase());
                        return (
                          <span
                            key={`${resume.id}-${skill}`}
                            className={`px-3 py-1 rounded-xl border text-xs font-semibold transition-all ${
                              isMatched
                                ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                : "bg-white/5 border-white/5 text-muted-foreground/60"
                            }`}
                          >
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {resume.parseStatus === "FAILED" && resume.parseError && (
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-bold tracking-tight italic">
                      {resume.parseError}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-6 shrink-0">
                  <span
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
                      resume.parseStatus === "PARSED"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : resume.parseStatus === "FAILED"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}
                  >
                    {resume.parseStatus === "PARSED" ? (
                      <CircleCheckBig className="h-3.5 w-3.5" />
                    ) : resume.parseStatus === "FAILED" ? (
                      <CircleX className="h-3.5 w-3.5" />
                    ) : null}
                    {resume.parseStatus === "PARSED" ? "PARSED" : resume.parseStatus}
                  </span>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs font-semibold text-muted-foreground/20 italic tabular-nums">
                      UPLOADED {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                    <Link
                      href={resume.r2Url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group/link flex items-center gap-2 text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      VIEW RESUME
                      <Upload className="h-3.5 w-3.5 rotate-45 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Console */}
        {!loading && totalPages > 1 && (
          <div className="mt-20 flex flex-wrap items-center justify-center gap-6">
            <Button
              variant="ghost"
              className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-xs font-semibold hover:bg-white/10 disabled:opacity-20 transition-all"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous Page
            </Button>
            <div className="px-8 flex flex-col items-center">
              <p className="text-xs font-semibold text-blue-500">Page</p>
              <p className="text-xl font-black mt-1 tabular-nums">{page} <span className="opacity-20">/</span> {totalPages}</p>
            </div>
            <Button
              variant="ghost"
              className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-xs font-semibold hover:bg-white/10 disabled:opacity-20 transition-all"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next Page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
