"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatLocation } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import { Search, User, MapPin, Briefcase, GraduationCap, FileText, ChevronRight, LayoutGrid, List } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
    <div className="min-h-screen w-full min-w-0 bg-black text-white animate-in fade-in duration-1000">
      <div className={containerClass}>
        {/* Talent Cloud Monitoring Header */}
        <div className="mb-16 border-b border-white/5 pb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Candidate Search</p>
          </div>
          <h1 className="text-4xl font-black md:text-6xl tracking-tighter leading-tight text-white">
            Explore{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
              Talent
            </span>
          </h1>
          <p className="mt-4 text-lg font-medium text-muted-foreground/60 italic max-w-2xl">
            Filter by skills, location, and keywords to find matching candidates for your job openings.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl backdrop-blur-3xl">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 opacity-50" />
              <Input
                placeholder="Search by name, email, title or keywords..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-12 pl-12 bg-transparent border-transparent focus-visible:ring-0 text-foreground font-medium"
              />
            </div>
            <div className="relative w-[220px]">
              <Briefcase className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 opacity-50" />
              <Input
                placeholder="Key Skills..."
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-12 pl-12 bg-transparent border-transparent focus-visible:ring-0 text-foreground font-medium"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="h-12 px-8 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Search Now
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Tactical Filters Sidebar */}
          <aside className="w-full shrink-0 lg:w-80">
            <div className="linear-card sticky top-32 rounded-[2.5rem] p-8 bg-white/[0.02] border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Advanced Filters</h2>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic flex items-center gap-2">
                    <Search className="h-3 w-3" />
                    Keywords
                  </label>
                  <Input
                    placeholder="Enter keywords..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-12 bg-white/5 border-white/5 rounded-2xl text-sm font-medium text-foreground px-4"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Location
                  </label>
                  <LocationDropdown value={location} onChange={setLocation} />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic flex items-center gap-2">
                    <Briefcase className="h-3 w-3" />
                    Skills
                  </label>
                  <Input
                    placeholder="React, Next.js, etc..."
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-12 bg-white/5 border-white/5 rounded-2xl text-sm font-medium text-foreground px-4"
                  />
                </div>

                <div className="pt-6 flex flex-col gap-3">
                  <Button
                    onClick={handleSearch}
                    className="h-14 w-full rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClear}
                    className="h-12 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 transition-all"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              <div className="mt-12 p-6 rounded-[1.5rem] bg-blue-500/5 border border-blue-500/10">
                <p className="text-[9px] leading-relaxed text-muted-foreground/60 font-medium italic">
                  Candidates are updated in real-time. Adjust your filters to find exactly who you need.
                </p>
              </div>
            </div>
          </aside>

          {/* Result Grid */}
          <div className="flex-1 space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
              <div className="flex flex-col gap-1">
                 <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">
                   {total} <span className="text-sm font-black uppercase tracking-widest text-blue-500 opacity-60 ml-2">Candidates Found</span>
                 </p>
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                    Showing results: {start} - {end}
                 </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex p-1 rounded-xl bg-white/5 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-2.5 transition-all ${viewMode === "grid" ? "toggle-active" : "text-muted-foreground hover:bg-white/5"}`}
                    aria-label="Grid Mode"
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded-lg p-2.5 transition-all ${viewMode === "list" ? "toggle-active" : "text-muted-foreground hover:bg-white/5"}`}
                    aria-label="List Mode"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="linear-card rounded-[3rem] p-32 text-center animate-pulse">
                <p className="text-sm font-black uppercase tracking-[0.5em] text-blue-500">Searching Candidates...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="linear-card rounded-[3rem] p-32 text-center border-dashed border-white/10">
                <p className="text-xl font-black text-muted-foreground/40 uppercase tracking-widest italic leading-relaxed">
                  No candidates found. <br />Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                {candidates.map((candidate, idx) => (
                  <div
                    key={candidate.id}
                    className={`linear-card group flex flex-col rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-8 transition-all hover:bg-white/[0.05] animate-in fade-in slide-in-from-bottom-5 duration-700 ${viewMode === "list" ? "md:flex-row md:items-center md:gap-10" : ""}`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className={`flex items-start gap-4 ${viewMode === "list" ? "flex-1" : "mb-8"}`}>
                      <CandidateAvatar
                        profileImage={candidate.profileImage}
                        firstName={candidate.firstName}
                        lastName={candidate.lastName}
                        size="lg"
                        className="rounded-2xl border-2 border-white/10 shadow-2xl transition-transform group-hover:scale-110"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-black text-foreground tracking-tight line-clamp-1 group-hover:text-blue-500 transition-colors">
                            {candidate.firstName} {candidate.lastName}
                          </h3>
                        </div>
                        <p className="mb-2 text-xs font-bold text-orange-500 truncate">
                          {candidate.user?.email || "No Email Provided"}
                        </p>
                        {candidate.availabilityStatus && (
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                            {candidate.availabilityStatus}
                          </span>
                        )}
                        <p className="mt-2 flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                          <Briefcase className="h-3 w-3 text-blue-500/50" />
                          {candidate.jobTitle || "Job Title Not Specified"}
                        </p>
                      </div>
                    </div>

                    <div className={`flex-1 space-y-6 ${viewMode === "list" ? "hidden md:block" : ""}`}>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-xs leading-relaxed text-muted-foreground font-medium italic line-clamp-2">
                          {candidate.bio ? `&quot;${candidate.bio}&quot;` : "Candidate profile contains high-value skills. View profile for more details."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest tabular-nums italic">
                        {candidate.location && (
                           <span className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-blue-500/50" />
                            {formatLocation(candidate.location)}
                           </span>
                        )}
                        <span className="flex items-center gap-2">
                         <Briefcase className="h-3.5 w-3.5 text-blue-500/50" />
                         {candidate.experience != null ? `${candidate.experience} YRS EXP` : "EXPERIENCED"}
                        </span>
                      </div>

                      {candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.skills.slice(0, 3).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-3 py-1 rounded-lg bg-blue-500/5 border border-blue-500/10 text-[9px] font-black uppercase tracking-widest text-blue-400"
                            >
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 3 && (
                            <span className="px-2 py-1 text-[9px] font-black text-muted-foreground/30">
                              +{candidate.skills.length - 3} MORE
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`pt-8 border-t border-white/5 flex items-center justify-between gap-4 ${viewMode === "list" ? "border-t-0 pt-0" : "mt-8"}`}>
                      {candidate.resumeUrl ? (
                        <a
                          href={candidate.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          VIEW RESUME
                        </a>
                      ) : (
                         <div className="hidden sm:flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                               <GraduationCap className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20 italic max-w-[120px] line-clamp-1">
                              {candidate.education || "EDUCATION"}
                            </p>
                         </div>
                      )}
                      <Link href={`/employer/candidates/${candidate.id}`}>
                        <Button
                          variant="ghost"
                          className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 transition-all active:scale-95 group"
                        >
                          PROFILE
                          <ChevronRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-red-500" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous Page
                </Button>
                <div className="px-8 flex flex-col items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Page</p>
                  <p className="text-xl font-black mt-1 tabular-nums">{page} <span className="opacity-20">/</span> {totalPages}</p>
                </div>
                <Button
                  variant="ghost"
                  className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next Page
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
