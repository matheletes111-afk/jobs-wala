"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Mail, MapPin, Briefcase, CalendarDays } from "lucide-react";

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
  const [skills, setSkills] = useState((initialParams.skills as string) || "");
  const [location, setLocation] = useState((initialParams.location as string) || "");
  const [minExperience, setMinExperience] = useState(
    (initialParams.minExperience as string) || ""
  );

  const [appliedKeyword, setAppliedKeyword] = useState(keyword);
  const [appliedSkills, setAppliedSkills] = useState(skills);
  const [appliedLocation, setAppliedLocation] = useState(location);
  const [appliedMinExperience, setAppliedMinExperience] = useState(minExperience);

  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 12;

  const fetchResumes = useCallback(
    async (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
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
      appliedLocation,
      appliedMinExperience
    );
  }, [
    page,
    appliedKeyword,
    appliedSkills,
    appliedLocation,
    appliedMinExperience,
    fetchResumes,
  ]);

  const apply = () => {
    setAppliedKeyword(keyword);
    setAppliedSkills(skills);
    setAppliedLocation(location);
    setAppliedMinExperience(minExperience);
    setPage(1);
  };

  const clear = () => {
    setKeyword("");
    setSkills("");
    setLocation("");
    setMinExperience("");
    setAppliedKeyword("");
    setAppliedSkills("");
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
    <div className="min-h-screen w-full min-w-0 bg-black text-white animate-in fade-in duration-1000">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10">
        <div className="mb-16 border-b border-white/5 pb-10">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Talent Database</p>
           </div>
           <h1 className="text-4xl font-black md:text-6xl tracking-tighter text-gradient leading-tight">
             Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">Library</span>
           </h1>
           <p className="mt-4 text-lg font-medium text-muted-foreground/60 italic max-w-2xl">
             Access the central resume database. Filter by candidate information, location, and key skills.
           </p>

           <div className="mt-12 grid gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl backdrop-blur-3xl md:grid-cols-5">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search candidates (Name, Email, etc)..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && apply()}
                  className="h-12 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-foreground placeholder:text-muted-foreground/20 italic"
                />
              </div>
              <Input
                placeholder="Skills..."
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                className="h-12 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-foreground placeholder:text-muted-foreground/20 italic"
              />
              <Input
                placeholder="Location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                 className="h-12 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-foreground placeholder:text-muted-foreground/20 italic"
              />
              <Input
                type="number"
                min={0}
                placeholder="Years Exp..."
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                 className="h-12 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-foreground placeholder:text-muted-foreground/20 italic"
              />
           </div>

           <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button onClick={apply} className="h-12 px-10 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                <Search className="mr-2 h-4 w-4" />
                Search Database
              </Button>
              <Button variant="ghost" onClick={clear} className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 transition-all">
                Clear Filters
              </Button>
              <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest italic ml-auto">{rangeText}</span>
           </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full linear-card rounded-[3rem] p-32 text-center animate-pulse">
               <p className="text-sm font-black uppercase tracking-[0.5em] text-emerald-500">Accessing Resume Archives...</p>
            </div>
          ) : error ? (
            <div className="col-span-full p-8 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-400 text-center font-bold italic">
               &lt;Error: {error}&gt;
            </div>
          ) : resumes.length === 0 ? (
            <div className="col-span-full linear-card rounded-[3rem] p-32 text-center border-dashed border-white/10">
               <p className="text-xl font-black text-muted-foreground/40 uppercase tracking-widest italic leading-relaxed">
                  No records match your search criteria.
               </p>
            </div>
          ) : (
            resumes.map((resume, idx) => (
              <div
                key={resume.id}
                className="linear-card group flex flex-col rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-8 transition-all hover:bg-white/[0.05] animate-in fade-in slide-in-from-bottom-5 duration-700"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-4 mb-6">
                   <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="h-6 w-6 text-emerald-400" />
                   </div>
                   <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 truncate">{resume.originalFileName}</p>
                      <h3 className="text-lg font-black text-foreground tracking-tight line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {resume.extractedName || "Unknown Subject"}
                      </h3>
                   </div>
                </div>

                <div className="flex-1 space-y-4">
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                      <p className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                        <Mail className="h-3.5 w-3.5 text-emerald-500/50" />
                        {resume.extractedEmail || "DATA ENCRYPTED"}
                      </p>
                      <p className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500/50" />
                        {resume.extractedLocation || "ORBITAL / REMOTE"}
                      </p>
                      <p className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                        <Briefcase className="h-3.5 w-3.5 text-emerald-500/50" />
                        {resume.currentTitle || "UNDEFINED ROLE"} · {resume.experienceYears != null ? `${resume.experienceYears} YRS` : "N/A"}
                      </p>
                   </div>

                   {resume.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {resume.skills.slice(0, 5).map((skill) => (
                          <span
                            key={`${resume.id}-${skill}`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[8px] font-black uppercase tracking-widest text-emerald-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                   <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20 italic tabular-nums">
                     ARCHIVED: {new Date(resume.createdAt).toLocaleDateString("en-GB")}
                   </p>
                   <a
                    href={resume.r2Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 flex items-center text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
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
              className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous Set
            </Button>
            <div className="px-8 flex flex-col items-center">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Query Page</p>
               <p className="text-xl font-black mt-1 tabular-nums">{page} <span className="opacity-20">/</span> {totalPages}</p>
            </div>
            <Button
              variant="ghost"
              className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all"
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

