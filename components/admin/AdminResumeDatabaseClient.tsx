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

  const [keyword, setKeyword] = useState("");
  const [skills, setSkills] = useState("");
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
  ]);

  const onApplyFilters = () => {
    setAppliedKeyword(keyword);
    setAppliedSkills(skills);
    setAppliedLocation(location);
    setAppliedParseStatus(parseStatus);
    setAppliedMinExperience(minExperience);
    setPage(1);
  };

  const onClearFilters = () => {
    setKeyword("");
    setSkills("");
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
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10">
        <div className="rounded-b-2xl bg-linear-to-b from-slate-50 to-slate-100/80 px-6 pb-8 pt-6 md:px-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Admin Resume Database
          </p>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Review and search uploaded resumes
          </h1>
          <p className="mb-6 text-gray-600">
            Bulk upload resumes, then filter by keyword, skills, location, and parse status.
          </p>

          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  setFiles(Array.from(e.target.files ?? []));
                }}
                className="flex-1"
              />
              <Button
                onClick={onUpload}
                disabled={uploading || files.length === 0}
                className="bg-[#2563eb] hover:bg-[#1d4ed8]"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Bulk Upload"}
              </Button>
            </div>
            {files.length > 0 ? (
              <p className="text-sm text-gray-600">{files.length} file(s) selected</p>
            ) : null}
            {message ? (
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                {message}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm text-gray-600">Keyword</label>
              <Input
                placeholder="File name, name, email, text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApplyFilters();
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Skills (comma)</label>
              <Input
                placeholder="react,node.js"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApplyFilters();
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Location</label>
              <Input
                placeholder="Bengaluru"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApplyFilters();
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Parse status</label>
              <Select
                value={parseStatus}
                onValueChange={(val) => setParseStatus(val as ParseStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARSED">Parsed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Min exp (years)</label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApplyFilters();
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={onApplyFilters} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
              <Search className="mr-2 h-4 w-4" />
              Apply filters
            </Button>
            <Button variant="outline" onClick={onClearFilters}>
              Clear
            </Button>
            <Button
              variant="destructive"
              onClick={onDeleteFailed}
              disabled={loading || uploading}
            >
              Delete failed resumes
            </Button>
            <span className="text-sm text-gray-500">{rangeText}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
              Loading resumes...
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
              No resumes found for current filters.
            </div>
          ) : (
            resumes.map((resume) => (
              <div
                key={resume.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm text-gray-500">
                      <FileText className="h-4 w-4" />
                      {resume.originalFileName}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-gray-900">
                      {resume.extractedName || "Unknown Candidate"}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {resume.extractedEmail || "No email"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {resume.extractedLocation || "No location"}
                      </span>
                      <span>{resume.currentTitle || "No title"}</span>
                      <span>{resume.experienceYears != null ? `${resume.experienceYears} yrs` : "Exp n/a"}</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(resume.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        resume.parseStatus === "PARSED"
                          ? "bg-emerald-100 text-emerald-700"
                          : resume.parseStatus === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {resume.parseStatus === "PARSED" ? (
                        <CircleCheckBig className="h-3.5 w-3.5" />
                      ) : resume.parseStatus === "FAILED" ? (
                        <CircleX className="h-3.5 w-3.5" />
                      ) : null}
                      {resume.parseStatus}
                    </span>
                    <Link
                      href={resume.r2Url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-medium text-[#2563eb] hover:underline"
                    >
                      Open file
                    </Link>
                    <p className="text-xs text-gray-500">{formatBytes(resume.sizeBytes)}</p>
                  </div>
                </div>

                {resume.skills.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {resume.skills.map((skill) => (
                      <span
                        key={`${resume.id}-${skill}`}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#2563eb]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}

                {resume.parseStatus === "FAILED" && resume.parseError ? (
                  <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {resume.parseError}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>

        {!loading && totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
