"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Mail, MapPin, Briefcase, CalendarDays } from "lucide-react";
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
}: {
  searchParams: { [key: string]: string | string[] | undefined };
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

  const [appliedKeyword, setAppliedKeyword] = useState(keyword);
  const [appliedSkills, setAppliedSkills] = useState<string>((initialParams.skills as string) || "");
  const [appliedIsBooleanSearch, setAppliedIsBooleanSearch] = useState(false);
  const [appliedLocation, setAppliedLocation] = useState(location);
  const [appliedMinExperience, setAppliedMinExperience] = useState(minExperience);

  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);
  const limit = 12;

  const fetchResumes = useCallback(
    async (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
      isBooleanSearchVal: boolean,
      locationVal: string,
      minExpVal: string
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
        const res = await fetch(`/api/employer/resume-search?${params.toString()}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch resumes");
        }
        const data: FetchResult = await res.json();
        setResumes(data.resumes ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? 1);
      } catch (e) {
        setResumes([]);
        setTotal(0);
        setTotalPages(1);
        setError(e instanceof Error ? e.message : "Failed to fetch resumes");
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
      appliedIsBooleanSearch,
      appliedLocation,
      appliedMinExperience
    );
  }, [
    page,
    appliedKeyword,
    appliedSkills,
    appliedIsBooleanSearch,
    appliedLocation,
    appliedMinExperience,
    fetchResumes,
    refreshCount,
  ]);

  const apply = () => {
    setAppliedKeyword(keyword);
    setAppliedSkills(isBooleanSearch ? booleanSkillsExpr : skills.join(","));
    setAppliedIsBooleanSearch(isBooleanSearch);
    setAppliedLocation(location);
    setAppliedMinExperience(minExperience);
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
    setAppliedKeyword("");
    setAppliedSkills("");
    setAppliedIsBooleanSearch(false);
    setAppliedLocation("");
    setAppliedMinExperience("");
    setPage(1);
  };

  const rangeText = useMemo(() => {
    if (total === 0) return "Showing 0 results";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `Showing ${start}-${end} of ${total}`;
  }, [limit, page, total]);

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10">
        <div className="mb-16 border-b border-slate-200 pb-10">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-semibold text-emerald-500">Talent Database</p>
           </div>
           <h1 className="text-4xl font-bold md:text-6xl tracking-tighter text-foreground leading-tight">
             Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">Library</span>
           </h1>
           <p className="mt-4 text-lg font-medium text-muted-foreground/60 italic max-w-2xl">
             Access the central resume database. Filter by candidate information, location, and key skills.
           </p>

           <div className="mt-12 grid gap-4 p-4 rounded-3xl linear-card shadow-lg md:grid-cols-5">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search candidates (Name, Email, etc)..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && apply()}
                  className="h-12 bg-white border border-slate-200 shadow-sm rounded-2xl text-xs font-semibold text-foreground placeholder:text-muted-foreground/40 italic"
                />
              </div>
              <div className="md:col-span-1 flex flex-col gap-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skills</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="employer-boolean-search-toggle"
                      checked={isBooleanSearch}
                      onChange={(e) => setIsBooleanSearch(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="employer-boolean-search-toggle" className="text-[9px] font-black uppercase tracking-wider text-black cursor-pointer select-none">
                      Boolean Search
                    </label>
                  </div>
                </div>
                {isBooleanSearch ? (
                  <Input
                    placeholder="e.g. java AND react"
                    value={booleanSkillsExpr}
                    onChange={(e) => setBooleanSkillsExpr(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && apply()}
                    className="h-12 bg-white border border-slate-200 shadow-sm rounded-2xl text-xs font-semibold text-foreground placeholder:text-muted-foreground/40 italic"
                  />
                ) : (
                  <SkillTagInput
                    value={skills}
                    onChange={setSkills}
                    placeholder="Skills..."
                    className="w-full"
                  />
                )}
              </div>
              <Input
                placeholder="Location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                 className="h-12 bg-white border border-slate-200 shadow-sm rounded-2xl text-xs font-semibold text-foreground placeholder:text-muted-foreground/40 italic"
              />
              <Input
                type="number"
                min={0}
                placeholder="Years Exp..."
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                 className="h-12 bg-white border border-slate-200 shadow-sm rounded-2xl text-xs font-semibold text-foreground placeholder:text-muted-foreground/40 italic"
              />
           </div>

           <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button onClick={apply} className="h-12 px-10 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                <Search className="mr-2 h-4 w-4" />
                Search Database
              </Button>
              <Button variant="ghost" onClick={clear} className="h-12 px-6 rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-slate-100 transition-all">
                Clear Filters
              </Button>
              <span className="text-xs font-semibold text-muted-foreground/40 italic ml-auto">{rangeText}</span>
           </div>
        </div>

        <div className="grid gap-6 grid-cols-1">
          {loading ? (
            <div className="col-span-full rounded-[3rem] p-32 text-center animate-pulse border border-slate-200 bg-white">
               <p className="text-sm font-semibold text-emerald-500">Accessing Resume Archives...</p>
            </div>
          ) : error ? (
            <div className="col-span-full p-8 rounded-[2rem] bg-red-50 border border-red-200 text-red-700 text-center font-bold italic">
               &lt;Error: {error}&gt;
            </div>
          ) : resumes.length === 0 ? (
            <div className="col-span-full rounded-[3rem] p-32 text-center border-dashed border-slate-200 bg-slate-50">
               <p className="text-xl font-bold text-muted-foreground/40 italic leading-relaxed">
                  No records match your search criteria.
               </p>
            </div>
          ) : (
            resumes.map((resume, idx) => (
              <div
                key={resume.id}
                className="linear-card group flex flex-col lg:flex-row lg:items-center justify-between gap-10 rounded-[2.5rem] shadow-md p-10 transition-all hover:shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-700"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex-1 min-w-0 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground/30 italic truncate tabular-nums">
                      {resume.originalFileName}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-foreground tracking-tighter group-hover:text-emerald-400 transition-colors">
                      {resume.extractedName || "Unknown Subject"}
                    </h3>
                    <div className="mt-4 flex flex-wrap items-center gap-6">
                      <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 italic">
                        <Mail className="h-3.5 w-3.5 text-emerald-500/50" />
                        {resume.extractedEmail || "DATA ENCRYPTED"}
                      </span>
                      <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 italic">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500/50" />
                        {resume.extractedLocation || "ORBITAL / REMOTE"}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                        {resume.currentTitle || "UNDEFINED ROLE"}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground/40 tabular-nums">
                        {resume.experienceYears != null ? `${resume.experienceYears}YRS EXP` : "N/A"}
                      </span>
                    </div>
                  </div>

                  {resume.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
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
                            className={`px-3 py-1 rounded-xl border text-xs font-semibold transition-all ${
                              isMatched 
                                ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                                : "bg-slate-100 border-slate-200 text-slate-600"
                            }`}
                          >
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-6 shrink-0">
                  <p className="text-xs font-semibold text-muted-foreground/20 italic tabular-nums">
                    ARCHIVED: {new Date(resume.createdAt).toLocaleDateString("en-GB")}
                  </p>
                  <a
                    href={resume.r2Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 px-8 rounded-2xl bg-slate-100 border border-slate-200 flex items-center text-xs font-semibold text-foreground hover:bg-slate-200 transition-all active:scale-95 shadow-sm hover:shadow-md"
                  >
                    SYNC PDF
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && totalPages > 1 && (
           <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="ghost"
              className="h-12 px-8 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold hover:bg-slate-200 disabled:opacity-30 transition-all text-foreground"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous Set
            </Button>
            <div className="px-8 flex flex-col items-center">
               <p className="text-xs font-semibold text-emerald-500">Query Page</p>
               <p className="text-xl font-black mt-1 tabular-nums">{page} <span className="opacity-20">/</span> {totalPages}</p>
            </div>
            <Button
              variant="ghost"
              className="h-12 px-8 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold hover:bg-slate-200 disabled:opacity-30 transition-all text-foreground"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next Set
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

