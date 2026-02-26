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
import CandidateAvatar from "@/components/CandidateAvatar";
import { Search, FileText, MapPin, User } from "lucide-react";
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
  job: { id: string; title: string; location: string; category: string };
  jobSeeker: { id: string; firstName: string; lastName: string; profileImage?: string | null; resumeUrl: string | null };
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
    <div className="min-h-screen w-full min-w-0 bg-gray-50/50">
      <div className={containerClass}>
        {/* Hero / Search Section */}
        <div className="rounded-b-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 px-6 pb-8 pt-6 md:px-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Review Applications
          </p>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Applications
          </h1>
          <p className="mb-6 text-gray-600">
            Filter by job, status, or search applicants. Shortlist or reject candidates.
          </p>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, job title, cover letter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <div className="w-[180px]">
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All jobs</SelectItem>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[140px]">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#2563eb] hover:bg-[#1d4ed8]"
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={loading}
              className="border-gray-300"
            >
              Clear filters
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row">
          {/* Left Filter Panel */}
          <aside className="w-full shrink-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:w-72">
            <h2 className="mb-4 font-semibold text-gray-900">Search applications</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  Search
                </label>
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">Job</label>
                <Select value={jobId} onValueChange={setJobId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All jobs</SelectItem>
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                    <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSearch}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]"
              >
                Apply filters
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={loading}
                className="w-full border-gray-300"
              >
                Clear filters
              </Button>
            </div>
          </aside>

          {/* Right Content */}
          <div className="flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{total} Applications Found</span>
                <span className="ml-2 text-sm">
                  Showing {start} - {end}
                </span>
              </p>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
                Loading applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
                No applications match your filters. Try adjusting search or clear filters.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-4">
                        <CandidateAvatar
                          profileImage={app.jobSeeker.profileImage}
                          firstName={app.jobSeeker.firstName}
                          lastName={app.jobSeeker.lastName}
                          size="md"
                          className="rounded-lg"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {app.jobSeeker.firstName} {app.jobSeeker.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Applied for: {app.job.title}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                              <MapPin className="h-3 w-3" />
                              {formatLocation(app.job.location)}
                            </span>
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#2563eb]">
                              {app.job.category}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-400">
                            Applied {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                          {app.coverLetter && (
                            <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                              {app.coverLetter}
                            </p>
                          )}
                          {app.jobSeeker.resumeUrl && (
                            <a
                              href={app.jobSeeker.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-sm text-[#2563eb] hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              View Resume
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          app.status === "SHORTLISTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : app.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {app.status}
                      </span>
                      <div className="flex gap-2">
                        <ApplicationActions
                          applicationId={app.id}
                          currentStatus={app.status}
                          onSuccess={handleApplicationUpdated}
                        />
                        <Link href={`/employer/candidates/${app.jobSeeker.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 border-[#2563eb] text-[#2563eb] hover:bg-blue-50">
                            <User className="h-3.5 w-3.5" />
                            View profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
