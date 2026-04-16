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
import { formatLocation } from "@/lib/utils";
import ApplicationActions from "@/components/employer/ApplicationActions";
import SkillMatchBar from "@/components/employer/SkillMatchBar";
import CandidateAvatar from "@/components/CandidateAvatar";
import { Search, FileText, MapPin, User, LayoutGrid, List } from "lucide-react";
import Link from "next/link";

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
  };
  jobSeeker: {
    id: string;
    firstName: string;
    lastName: string;
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

export default function EmployerApplicationListClient({
  jobs,
  initialJobId,
  initialStatus,
}: EmployerApplicationListClientProps) {
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
        setApplications(data.applications);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      } catch {
        setApplications([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchApplications(page, appliedSearch, appliedJobId, appliedStatus);
  }, [page, appliedSearch, appliedJobId, appliedStatus, fetchApplications]);

  const handleSearch = () => {
    setAppliedSearch(search);
    setAppliedJobId(jobId);
    setAppliedStatus(status);
    setPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setJobId("all");
    setStatus("all");
    setAppliedSearch("");
    setAppliedJobId("all");
    setAppliedStatus("all");
    setPage(1);
  };

  const handleApplicationUpdated = useCallback(() => {
    fetchApplications(page, appliedSearch, appliedJobId, appliedStatus);
  }, [page, appliedSearch, appliedJobId, appliedStatus, fetchApplications]);

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const containerClass =
    "mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10";

  return (
    <div className="min-h-screen w-full min-w-0 bg-black">
      <div className={containerClass}>
        {/* Hero / Search Section */}
        <div className="linear-card rounded-[2.5rem] bg-white/[0.02] p-10 sm:p-12 mb-16 animate-in fade-in slide-in-from-top-10 duration-1000">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
            Candidate Applications
          </p>
          <h1 className="mb-2 text-3xl font-black text-foreground lg:text-5xl tracking-tighter">
            Application <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Hub</span>
          </h1>
          <p className="mb-10 text-muted-foreground font-medium italic">
            Review applicant details, manage application statuses, and track your recruitment pipeline.
          </p>

          <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-white/5 bg-black/20 p-4 shadow-2xl">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                placeholder="Search by name, email, or application ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-12 pl-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 focus:border-primary/50 text-foreground font-medium"
              />
            </div>
            <div className="w-[180px]">
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest focus:ring-primary/20">
                  <SelectValue placeholder="All Missions" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-white/5">
                  <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Jobs</SelectItem>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id} className="text-[10px] font-black uppercase tracking-widest">
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px]">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest focus:ring-primary/20">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-white/5">
                  <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Status</SelectItem>
                  <SelectItem value="PENDING" className="text-[10px] font-black uppercase tracking-widest">Pending</SelectItem>
                  <SelectItem value="REVIEWED" className="text-[10px] font-black uppercase tracking-widest">Reviewed</SelectItem>
                  <SelectItem value="SHORTLISTED" className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Shortlisted</SelectItem>
                  <SelectItem value="REJECTED" className="text-[10px] font-black uppercase tracking-widest text-red-400">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-12 px-8 rounded-xl bg-primary hover:bg-blue-600 text-white font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                Search
              </Button>
              <Button
                variant="ghost"
                onClick={handleClear}
                disabled={loading}
                className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row">
          {/* Left Filter Panel */}
          <aside className="w-full shrink-0 lg:w-80 space-y-8 animate-in slide-in-from-left-10 duration-1000">
            <div className="linear-card rounded-[2rem] p-8 space-y-8 border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <Search className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Filter Results</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Applicant Name</label>
                  <Input
                    placeholder="Search applicants..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Job Selection</label>
                  <Select value={jobId} onValueChange={setJobId}>
                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                      <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Postings</SelectItem>
                      {jobs.map((j) => (
                        <SelectItem key={j.id} value={j.id} className="text-[10px] font-black uppercase tracking-widest text-foreground">
                          {j.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Application Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                      <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Statuses</SelectItem>
                      <SelectItem value="PENDING" className="text-[10px] font-black uppercase tracking-widest">Pending</SelectItem>
                      <SelectItem value="REVIEWED" className="text-[10px] font-black uppercase tracking-widest">Reviewed</SelectItem>
                      <SelectItem value="SHORTLISTED" className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Shortlisted</SelectItem>
                      <SelectItem value="REJECTED" className="text-[10px] font-black uppercase tracking-widest text-red-400">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4 space-y-3">
                  <Button
                    onClick={handleSearch}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
                  >
                    Update View
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClear}
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </div>

            <div className="linear-card rounded-[2rem] p-8 bg-emerald-500/5 border-emerald-500/20">
               <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4">Candidate Tip</h3>
               <p className="text-xs text-muted-foreground leading-loose font-medium italic">
                 "Review each candidate's skill match percentage to see how well they fit the requirements of your job posting."
               </p>
            </div>
          </aside>

          {/* Right Content */}
            <div className="flex-1">
              {!loading && applications.length > 0 && (
                <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-right-5 duration-700">
                  <div className="flex items-center gap-3">
                    <div className="h-1 w-8 rounded-full bg-primary/30" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Discovered {applications.length} Candidate Profiles
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`h-10 w-10 rounded-lg transition-all ${viewMode === "grid" ? "toggle-active" : "text-muted-foreground hover:bg-white/10"}`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={`h-10 w-10 rounded-lg transition-all ${viewMode === "table" ? "toggle-active" : "text-muted-foreground hover:bg-white/10"}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {loading ? (
                <div className="linear-card rounded-[2.5rem] p-24 text-center animate-pulse border-white/5">
                   <p className="text-lg font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Loading Applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="linear-card rounded-[2.5rem] p-24 text-center border-white/5">
                   <p className="text-lg font-black uppercase tracking-[0.2em] text-muted-foreground/60">No matching applications found.</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="space-y-8">
                  {applications.map((app, idx) => (
                    <div
                      key={app.id}
                      className="group flex flex-col gap-8 rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 transition-all hover:bg-white/5 hover:border-primary/30 animate-in slide-in-from-right-10 duration-700 fill-mode-both sm:flex-row sm:items-start sm:justify-between"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-8">
                          <CandidateAvatar
                            profileImage={app.jobSeeker.profileImage}
                            firstName={app.jobSeeker.firstName}
                            lastName={app.jobSeeker.lastName}
                            size="lg"
                            className="group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 italic">Applicant ID: {app.jobSeeker.id.slice(0,8)}</p>
                            <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                              {app.jobSeeker.firstName} {app.jobSeeker.lastName}
                            </h3>
                            <p className="mt-1 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                              Applied for: {app.job.title}
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                <MapPin className="h-3 w-3 text-primary" />
                                {formatLocation(app.job.location)}
                              </span>
                              <span className="px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary">
                                {app.job.category}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                                Date: {new Date(app.appliedAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="mt-8 p-6 rounded-[1.5rem] bg-black/20 border border-white/5">
                              <SkillMatchBar
                                percent={app.skillMatchPercent}
                                matched={app.skillMatchMatched}
                                total={app.skillMatchTotal}
                                matchedLabels={app.skillMatchLabels}
                              />
                            </div>
                            
                            {app.coverLetter && (
                              <div className="mt-6 p-6 rounded-[1.5rem] bg-white/[0.02] border-l-4 border-primary">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 italic">Cover Letter:</p>
                                <p className="text-sm text-muted-foreground leading-relaxed font-medium line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                                  {app.coverLetter}
                                </p>
                              </div>
                            )}
                            
                            {app.jobSeeker.resumeUrl && (
                              <a
                                href={app.jobSeeker.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 inline-flex items-center gap-3 h-10 px-6 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
                              >
                                <FileText className="h-4 w-4" />
                                View Resume
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-center sm:items-end gap-6">
                        <span
                          className={`h-10 px-6 rounded-xl border flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-xl ${
                            app.status === "SHORTLISTED"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/5"
                              : app.status === "REJECTED"
                                ? "bg-red-500/10 border-red-500/30 text-red-400 shadow-red-500/5"
                                : "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/5"
                          }`}
                        >
                          {app.status}
                        </span>
                        <div className="flex flex-col gap-3 w-full sm:w-auto">
                          <div className="h-10 px-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <ApplicationActions
                              applicationId={app.id}
                              currentStatus={app.status}
                              onSuccess={handleApplicationUpdated}
                            />
                          </div>
                          <Link href={`/employer/candidates/${app.jobSeeker.id}`}>
                            <Button variant="ghost" className="w-full h-10 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 gap-2 transition-all">
                              <User className="h-3.5 w-3.5" />
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] overflow-hidden animate-in fade-in duration-700">
                   <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Candidate</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Applied For</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Skill Match</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((app) => (
                          <tr key={app.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <CandidateAvatar
                                  profileImage={app.jobSeeker.profileImage}
                                  firstName={app.jobSeeker.firstName}
                                  lastName={app.jobSeeker.lastName}
                                  size="sm"
                                  className="h-10 w-10"
                                />
                                <div className="min-w-0">
                                  <Link href={`/employer/candidates/${app.jobSeeker.id}`}>
                                    <p className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{app.jobSeeker.firstName} {app.jobSeeker.lastName}</p>
                                  </Link>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">ID: {app.jobSeeker.id.slice(0,8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                               <span
                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  app.status === "SHORTLISTED"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : app.status === "REJECTED"
                                      ? "bg-red-500/10 text-red-400"
                                      : "bg-blue-500/10 text-blue-400"
                                }`}
                              >
                                {app.status}
                              </span>
                            </td>
                            <td className="p-6">
                              <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground line-clamp-1">{app.job.title}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{app.job.category}</p>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <div className="h-1 w-16 rounded-full bg-white/10 overflow-hidden">
                                  <div 
                                    className="h-full bg-primary" 
                                    style={{ width: `${app.skillMatchPercent ?? 0}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-black text-primary">{Math.round(app.skillMatchPercent ?? 0)}%</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-8 px-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center">
                                  <ApplicationActions
                                    applicationId={app.id}
                                    currentStatus={app.status}
                                    onSuccess={handleApplicationUpdated}
                                  />
                                </div>
                                <Link href={`/employer/candidates/${app.jobSeeker.id}`}>
                                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-white/10 hover:bg-primary hover:border-primary hover:text-white transition-all">
                                    View
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

              {!loading && totalPages > 1 && (
                <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    Next
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
