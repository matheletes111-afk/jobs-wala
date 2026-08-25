"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatLocation, formatPhoneForCsv } from "@/lib/utils";
import ApplicationActions from "@/components/employer/ApplicationActions";
import SkillMatchBar from "@/components/employer/SkillMatchBar";
import { skillKeywordMatch } from "@/lib/skill-match";
import CandidateAvatar from "@/components/CandidateAvatar";
import { Search, FileText, MapPin, User, LayoutGrid, List, Download } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Pagination from "@/components/common/Pagination";

interface JobOption {
  id: string;
  title: string;
}

interface ApplicationItem {
  id: string;
  status: string;
  appliedAt: string;
  coverLetter: string | null;
  job: {
    id: string;
    title: string;
    location: string;
    category: string;
    requiredSkills: string[];
    employmentType: string;
    workMode: string;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string | null;
    payType: string | null;
  };
  jobSeeker: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    experience?: number | null;
    education?: string | null;
    jobTitle?: string | null;
    profileImage?: string | null;
    resumeUrl: string | null;
    skills: string[];
  };
  skillMatchPercent: number | null;
  skillMatchMatched: number;
  skillMatchTotal: number;
  skillMatchLabels: string[];
}

interface FetchResult {
  applications: ApplicationItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

interface EmployerApplicationListClientProps {
  jobs: JobOption[];
  initialJobId?: string;
  initialStatus?: string;
}

const formatEmploymentType = (type: string) => {
  if (!type) return "";
  return type.replace("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const formatSalary = (min: number | null, max: number | null, currency: string | null, payType: string | null) => {
  if (min === null && max === null) return null;
  const cur = currency || "INR";
  const pType = payType ? ` / ${payType.toLowerCase()}` : "";
  if (min !== null && max !== null) {
    return `${cur} ${min.toLocaleString()} - ${max.toLocaleString()}${pType}`;
  }
  if (min !== null) {
    return `From ${cur} ${min.toLocaleString()}${pType}`;
  }
  if (max !== null) {
    return `Up to ${cur} ${max.toLocaleString()}${pType}`;
  }
  return null;
};

export default function EmployerApplicationListClient({
  jobs,
  initialJobId,
  initialStatus,
}: EmployerApplicationListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [jobId, setJobId] = useState(initialJobId ?? "all");
  const [status, setStatus] = useState(initialStatus ?? "all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedJobId, setAppliedJobId] = useState(initialJobId ?? "all");
  const [appliedStatus, setAppliedStatus] = useState(initialStatus ?? "all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const limit = 12;

  const updateUrl = useCallback(
    (
      pageNum: number,
      searchVal: string,
      jobIdVal: string,
      statusVal: string
    ) => {
      const params = new URLSearchParams();
      if (pageNum > 1) params.set("page", String(pageNum));
      if (searchVal.trim()) params.set("search", searchVal.trim());
      if (jobIdVal && jobIdVal !== "all") params.set("jobId", jobIdVal);
      if (statusVal && statusVal !== "all") params.set("status", statusVal);
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  const getCandidateDetailUrl = (candidateId: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
    if (appliedJobId && appliedJobId !== "all") params.set("jobId", appliedJobId);
    if (appliedStatus && appliedStatus !== "all") params.set("status", appliedStatus);
    const query = params.toString();
    return `/employer/candidates/${candidateId}${query ? `?${query}` : ""}`;
  };

  const fetchApplications = useCallback(
    async (
      pageNum: number,
      searchVal: string,
      jobIdVal: string,
      statusVal: string
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(limit));
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (jobIdVal && jobIdVal !== "all") params.set("jobId", jobIdVal);
        if (statusVal && statusVal !== "all") params.set("status", statusVal);
        const res = await fetch(`/api/employer/applications?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: FetchResult = await res.json();
        setApplications(data.applications ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? pageNum);
      } catch {
        setApplications([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  // Sync state with searchParams (URL) and sessionStorage
  useEffect(() => {
    let searchVal = searchParams.get("search");
    let jobIdVal = searchParams.get("jobId");
    let statusVal = searchParams.get("status");
    let pageValStr = searchParams.get("page");

    const hasParams =
      searchVal !== null ||
      jobIdVal !== null ||
      statusVal !== null ||
      pageValStr !== null;

    if (!hasParams && typeof window !== "undefined") {
      const saved = sessionStorage.getItem("employer_applications_filters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          searchVal = parsed.search || "";
          jobIdVal = parsed.jobId || initialJobId || "all";
          statusVal = parsed.status || initialStatus || "all";
          pageValStr = parsed.page ? String(parsed.page) : "1";

          const params = new URLSearchParams();
          if (pageValStr && pageValStr !== "1") params.set("page", pageValStr);
          if (searchVal?.trim()) params.set("search", searchVal.trim());
          if (jobIdVal && jobIdVal !== "all") params.set("jobId", jobIdVal);
          if (statusVal && statusVal !== "all") params.set("status", statusVal);
          const query = params.toString();
          router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
        } catch (_e) {}
      }
    }

    const finalSearch = searchVal || "";
    const finalJobId = jobIdVal || initialJobId || "all";
    const finalStatus = statusVal || initialStatus || "all";
    const finalPage = parseInt(pageValStr || "1", 10);

    setSearch(finalSearch);
    setJobId(finalJobId);
    setStatus(finalStatus);
    setPage(finalPage);

    setAppliedSearch(finalSearch);
    setAppliedJobId(finalJobId);
    setAppliedStatus(finalStatus);

    const isClean =
      !finalSearch &&
      finalJobId === "all" &&
      finalStatus === "all" &&
      finalPage === 1;

    if (typeof window !== "undefined") {
      if (isClean) {
        try {
          sessionStorage.removeItem("employer_applications_filters");
        } catch (_e) {}
      } else {
        try {
          sessionStorage.setItem(
            "employer_applications_filters",
            JSON.stringify({
              search: finalSearch,
              jobId: finalJobId,
              status: finalStatus,
              appliedSearch: finalSearch,
              appliedJobId: finalJobId,
              appliedStatus: finalStatus,
              page: finalPage,
            })
          );
        } catch (_e) {}
      }
    }
  }, [searchParams, pathname, router, initialJobId, initialStatus]);

  useEffect(() => {
    fetchApplications(page, appliedSearch, appliedJobId, appliedStatus);
  }, [page, appliedSearch, appliedJobId, appliedStatus, fetchApplications]);

  const handleSearch = () => {
    const hasInputs = search.trim().length > 0 || (jobId && jobId !== "all") || (status && status !== "all");
    if (!hasInputs) {
      handleClear();
    } else {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("employer_applications_filters");
        } catch (_e) {}
      }
      updateUrl(1, search, jobId, status);
    }
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("employer_applications_filters");
      } catch (_e) {}
    }

    setSearch("");
    setJobId("all");
    setStatus("all");
    setAppliedSearch("");
    setAppliedJobId("all");
    setAppliedStatus("all");
    setPage(1);

    router.replace(pathname, { scroll: false });
    fetchApplications(1, "", "all", "all");
  };

  const handleApplicationUpdated = useCallback(() => {
    fetchApplications(page, appliedSearch, appliedJobId, appliedStatus);
  }, [page, appliedSearch, appliedJobId, appliedStatus, fetchApplications]);

  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async (applyFilters: boolean) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("export", "true");
      if (applyFilters) {
        if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
        if (appliedJobId && appliedJobId !== "all") params.set("jobId", appliedJobId);
        if (appliedStatus && appliedStatus !== "all") params.set("status", appliedStatus);
      }
      
      const res = await fetch(`/api/employer/applications?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch applications for export");
      const data = await res.json();
      const exportApps = data.applications ?? [];
      
      if (exportApps.length === 0) {
        alert("No applications found to export.");
        return;
      }
      
      const headers = [
        "Application ID", "Status", "Applied At", "Cover Letter",
        "Job ID", "Job Title", "Job Location", "Job Category", "Required Skills",
        "Candidate ID", "First Name", "Last Name", "Email", "Phone",
        "Candidate Location", "Experience (Years)", "Education", "Job Title Profile",
        "Candidate Skills", "Skill Match Percentage", "Matched Skills"
      ];
      const rows = exportApps.map((app: any) => [
        app.id,
        app.status,
        app.appliedAt ? new Date(app.appliedAt).toISOString().split('T')[0] : "",
        `"${(app.coverLetter || "").replace(/"/g, '""')}"`,
        app.job.id,
        `"${app.job.title.replace(/"/g, '""')}"`,
        `"${formatLocation(app.job.location, true)}"`,
        `"${app.job.category}"`,
        `"${(app.job.requiredSkills || []).join(", ").replace(/"/g, '""')}"`,
        app.jobSeeker.id,
        `"${app.jobSeeker.firstName.replace(/"/g, '""')}"`,
        `"${app.jobSeeker.lastName.replace(/"/g, '""')}"`,
        `"${(app.jobSeeker.email || "").replace(/"/g, '""')}"`,
        `"${formatPhoneForCsv(app.jobSeeker.phone).replace(/"/g, '""')}"`,
        `"${formatLocation(app.jobSeeker.location).replace(/"/g, '""')}"`,
        app.jobSeeker.experience ?? "",
        `"${(app.jobSeeker.education || "").replace(/"/g, '""')}"`,
        `"${(app.jobSeeker.jobTitle || "").replace(/"/g, '""')}"`,
        `"${(app.jobSeeker.skills || []).join(", ").replace(/"/g, '""')}"`,
        Math.round(app.skillMatchPercent ?? 0),
        `"${(app.skillMatchLabels || []).join(", ").replace(/"/g, '""')}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${applyFilters ? "filtered_" : "all_"}applications_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Failed to export applications.");
    } finally {
      setExporting(false);
    }
  };

  const containerClass =
    "mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10";

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-slate-800">
      <div className={containerClass}>
        {/* Welcome Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/60 pb-6 animate-in fade-in duration-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">Candidate Applications</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Application Hub</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Review applicant details, manage application statuses, and track your recruitment pipeline.</p>
          </div>
          {!loading && applications.length > 0 && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCSV(true)}
                loading={exporting}
                className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                {!exporting && <Download className="h-4 w-4" />}
                {exporting ? "Exporting..." : "Export Filtered"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCSV(false)}
                loading={exporting}
                className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                {!exporting && <Download className="h-4 w-4" />}
                {exporting ? "Exporting..." : "Export All"}
              </Button>
            </div>
          )}
        </div>

        {/* Clean Flat Filters Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 flex flex-col gap-5 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-11 pl-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white text-xs font-medium text-slate-700"
              />
            </div>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 text-xs font-semibold text-slate-600">
                <SelectValue placeholder="All Jobs" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg">
                <SelectItem value="all" className="text-xs font-semibold">All Jobs</SelectItem>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id} className="text-xs font-semibold">
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 text-xs font-semibold text-slate-600">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg">
                <SelectItem value="all" className="text-xs font-semibold">All Statuses</SelectItem>
                <SelectItem value="PENDING" className="text-xs font-semibold">Pending</SelectItem>
                <SelectItem value="REVIEWED" className="text-xs font-semibold">Reviewed</SelectItem>
                <SelectItem value="SHORTLISTED" className="text-xs font-semibold text-emerald-600">Shortlisted</SelectItem>
                <SelectItem value="REJECTED" className="text-xs font-semibold text-red-600">Rejected</SelectItem>
              </SelectContent>
            </Select>
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

        {/* Content list toggles */}
        {!loading && applications.length > 0 && (
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discovered {total} Candidate Profiles</span>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-9 w-9 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:bg-slate-200"}`}
              >
                <LayoutGrid className="h-4.5 w-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("table")}
                className={`h-9 w-9 rounded-lg transition-all ${viewMode === "table" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:bg-slate-200"}`}
              >
                <List className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Main candidates view */}
        <div className="w-full">
          {loading ? (
            <div className="rounded-2xl p-24 text-center border border-slate-200 bg-white shadow-sm animate-pulse">
              <p className="text-sm font-semibold text-slate-400 italic">Loading Applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-2xl p-24 text-center border border-slate-200 bg-white shadow-sm">
              <p className="text-sm font-semibold text-slate-400">No matching applications found.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="space-y-6">
              {applications.map((app, idx) => (
                <div
                  key={app.id}
                  className="bg-white border border-slate-200 group flex flex-col gap-6 rounded-2xl shadow-sm p-6 transition-all hover:shadow-md hover:border-blue-400/50 animate-in slide-in-from-bottom-2 duration-500 sm:flex-row sm:items-start sm:justify-between"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-4">
                      <CandidateAvatar
                        profileImage={app.jobSeeker.profileImage}
                        firstName={app.jobSeeker.firstName}
                        lastName={app.jobSeeker.lastName}
                        size="md"
                        className="group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Applicant ID: {app.jobSeeker.id.slice(0, 8)}</p>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight hover:underline">
                          <Link href={getCandidateDetailUrl(app.jobSeeker.id)}>
                            {app.jobSeeker.firstName} {app.jobSeeker.lastName}
                          </Link>
                        </h3>
                        <p className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Applied for: {app.job.title}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
                            <MapPin className="h-3 w-3 text-blue-500" />
                            {formatLocation(app.job.location, true)}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
                            {app.job.category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600">
                            {formatEmploymentType(app.job.employmentType)}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-xs font-semibold text-purple-600">
                            {app.job.workMode}
                          </span>
                          {formatSalary(app.job.salaryMin, app.job.salaryMax, app.job.currency, app.job.payType) && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-600">
                              {formatSalary(app.job.salaryMin, app.job.salaryMax, app.job.currency, app.job.payType)}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-400">
                            Date: {new Date(app.appliedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                          <SkillMatchBar
                            percent={app.skillMatchPercent}
                            matched={app.skillMatchMatched}
                            total={app.skillMatchTotal}
                            matchedLabels={app.skillMatchLabels}
                          />

                          <div className="pt-3 border-t border-slate-200/60 space-y-3">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 mb-1.5">Required Skills for this Job:</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {app.job.requiredSkills.map((reqSkill, sIdx) => {
                                  const matched = app.skillMatchLabels.some(l => l.toLowerCase() === reqSkill.toLowerCase());
                                  return (
                                    <span
                                      key={sIdx}
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${
                                        matched
                                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                          : "bg-slate-100 border-slate-200 text-slate-500"
                                      }`}
                                    >
                                      <span className="text-[10px]">{matched ? "✓" : "✗"}</span>
                                      {reqSkill}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 mb-1.5">Candidate's Full Profile Skills:</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {app.jobSeeker.skills.map((skill, sIdx) => {
                                  const isReq = app.job.requiredSkills.some(r => skillKeywordMatch(r, skill));
                                  return (
                                    <span
                                      key={sIdx}
                                      className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                        isReq
                                          ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                                          : "bg-slate-100 border-slate-200 text-slate-700"
                                      }`}
                                    >
                                      {skill} {isReq && <span className="text-xs font-bold text-blue-500 ml-1">(Matched)</span>}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {app.coverLetter && (
                          <div className="mt-4 p-4 rounded-xl bg-blue-55 border-l-4 border-blue-600">
                            <p className="text-xs font-semibold text-slate-500 mb-2">Cover Letter:</p>
                            <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                              {app.coverLetter}
                            </p>
                          </div>
                        )}

                        {app.jobSeeker.resumeUrl && (
                          <a
                            href={app.jobSeeker.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View Resume
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-center sm:items-end gap-4 border-t border-slate-100 pt-4 sm:border-t-0 sm:pt-0">
                    <span
                      className={`h-9 px-5 rounded-lg border flex items-center justify-center text-xs font-semibold ${
                        app.status === "SHORTLISTED"
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                          : app.status === "REJECTED"
                            ? "bg-red-50 border border-red-200 text-red-700"
                            : "bg-blue-50 border border-blue-200 text-blue-700"
                      }`}
                    >
                      {app.status}
                    </span>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <div className="h-9 px-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <ApplicationActions
                          applicationId={app.id}
                          currentStatus={app.status}
                          onSuccess={handleApplicationUpdated}
                        />
                      </div>
                      <Link href={getCandidateDetailUrl(app.jobSeeker.id)}>
                        <Button variant="ghost" className="w-full h-9 px-5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 gap-2 transition-all">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-700">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="p-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate</th>
                      <th className="p-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="p-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applied For</th>
                      <th className="p-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill Match</th>
                      <th className="p-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="p-4 px-6">
                          <div className="flex items-center gap-4">
                            <CandidateAvatar
                              profileImage={app.jobSeeker.profileImage}
                              firstName={app.jobSeeker.firstName}
                              lastName={app.jobSeeker.lastName}
                              size="sm"
                              className="h-10 w-10"
                            />
                            <div className="min-w-0">
                              <Link href={getCandidateDetailUrl(app.jobSeeker.id)}>
                                <p className="font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1">{app.jobSeeker.firstName} {app.jobSeeker.lastName}</p>
                              </Link>
                              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">ID: {app.jobSeeker.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 px-6">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              app.status === "SHORTLISTED"
                                ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                                : app.status === "REJECTED"
                                  ? "bg-red-50 border border-red-100 text-red-700"
                                  : "bg-blue-50 border border-blue-100 text-blue-700"
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4 px-6">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 line-clamp-1">{app.job.title}</p>
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{app.job.category}</p>
                          </div>
                        </td>
                        <td className="p-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-blue-600"
                                style={{ width: `${app.skillMatchPercent ?? 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-blue-600">{Math.round(app.skillMatchPercent ?? 0)}%</span>
                          </div>
                        </td>
                        <td className="p-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-9 px-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center">
                              <ApplicationActions
                                applicationId={app.id}
                                currentStatus={app.status}
                                onSuccess={handleApplicationUpdated}
                              />
                            </div>
                            <Link href={getCandidateDetailUrl(app.jobSeeker.id)}>
                              <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all">
                                Details
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => updateUrl(p, appliedSearch, appliedJobId, appliedStatus)}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
