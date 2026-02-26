"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatLocation } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import { Search, User, MapPin, Briefcase, GraduationCap, FileText } from "lucide-react";
import CandidateAvatar from "@/components/CandidateAvatar";

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
  education?: string | null;
  bio?: string | null;
  availabilityStatus?: string | null;
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
  const limit = 12;

  const fetchCandidates = useCallback(
    async (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
      locationVal: string
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(limit));
        if (keywordVal.trim()) params.set("keyword", keywordVal.trim());
        if (skillsVal.trim()) params.set("skills", skillsVal.trim());
        if (locationVal.trim()) params.set("location", locationVal.trim());
        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: FetchResult = await res.json();
        setCandidates(data.candidates ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? 1);
      } catch {
        setCandidates([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCandidates(page, appliedKeyword, appliedSkills, appliedLocation);
  }, [page, appliedKeyword, appliedSkills, appliedLocation, fetchCandidates]);

  const handleSearch = () => {
    setAppliedKeyword(keyword);
    setAppliedSkills(skills);
    setAppliedLocation(location);
    setPage(1);
  };

  const handleClear = () => {
    setKeyword("");
    setSkills("");
    setLocation("");
    setAppliedKeyword("");
    setAppliedSkills("");
    setAppliedLocation("");
    setPage(1);
  };

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
            Search Talent Cloud
          </p>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Search candidates
          </h1>
          <p className="mb-6 text-gray-600">
            Filter by skills, location, and keywords to find candidates aligned with your needs.
          </p>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="relative flex-1 min-w-[180px]">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Name, job title or keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleSearch())
                }
                className="pl-9"
              />
            </div>
            <div className="relative w-[180px]">
              <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Skills (comma-separated)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleSearch())
                }
                className="pl-9"
              />
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
            <h2 className="mb-4 font-semibold text-gray-900">Search candidates</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  Keyword
                </label>
                <Input
                  placeholder="Search..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleSearch())
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">Skills</label>
                <Input
                  placeholder="Skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  Location
                </label>
                <LocationDropdown value={location} onChange={setLocation} />
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
                <span className="font-semibold text-gray-900">
                  {total} Candidates Found
                </span>
                <span className="ml-2 text-sm">
                  Showing {start} - {end}
                </span>
              </p>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
                Loading candidates...
              </div>
            ) : candidates.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
                No candidates found. Try adjusting search or clear filters.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <CandidateAvatar
                        profileImage={candidate.profileImage}
                        firstName={candidate.firstName}
                        lastName={candidate.lastName}
                        size="lg"
                        className="rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {candidate.firstName} {candidate.lastName}
                          </h3>
                          {candidate.availabilityStatus && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              {candidate.availabilityStatus}
                            </span>
                          )}
                        </div>
                        {candidate.jobTitle && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-600">
                            <Briefcase className="h-3.5 w-3.5 shrink-0" />
                            {candidate.jobTitle}
                            {candidate.experience != null &&
                              ` · ${candidate.experience} yrs exp`}
                          </p>
                        )}
                        {candidate.location && (
                          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {formatLocation(candidate.location)}
                          </p>
                        )}
                      </div>
                    </div>

                    {candidate.education && (
                      <p className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                        <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                        <span className="line-clamp-2">{candidate.education}</span>
                      </p>
                    )}

                    {candidate.bio && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                        {candidate.bio}
                      </p>
                    )}

                    {candidate.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {candidate.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#2563eb]"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 5 && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            +{candidate.skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                      {candidate.resumeUrl && (
                        <a
                          href={candidate.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-[#2563eb] hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          View Resume
                        </a>
                      )}
                      <Link
                        href={`/employer/candidates/${candidate.id}`}
                        className="ml-auto"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#2563eb] text-[#2563eb] hover:bg-blue-50"
                        >
                          View profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages: (number | "ellipsis")[] = [];
                    const show = 3;
                    if (totalPages <= 7) {
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
                        <span key={`e-${i}`} className="px-2 text-gray-400">
                          …
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          size="sm"
                          className={`min-w-[2.25rem] ${page === p ? "bg-[#2563eb] hover:bg-[#1d4ed8]" : ""}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    );
                  })()}
                </div>
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
