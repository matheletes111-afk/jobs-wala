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
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10">
        <div className="rounded-b-2xl bg-linear-to-b from-slate-50 to-slate-100/80 px-6 pb-8 pt-6 md:px-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Resume Database Search
          </p>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Search parsed resumes
          </h1>
          <p className="mb-6 text-gray-600">
            Filter by keyword, skills, location and experience from admin resume database records.
          </p>

          <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:grid-cols-5">
            <Input
              placeholder="Name, email, title, keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              className="md:col-span-2"
            />
            <Input
              placeholder="Skills (comma)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
            />
            <Input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
            />
            <Input
              type="number"
              min={0}
              placeholder="Min exp"
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={apply} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button variant="outline" onClick={clear}>
              Clear
            </Button>
            <span className="text-sm text-gray-500">{rangeText}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
              Loading resumes...
            </div>
          ) : error ? (
            <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {error}
            </div>
          ) : resumes.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
              No parsed resumes found.
            </div>
          ) : (
            resumes.map((resume) => (
              <div
                key={resume.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="h-4 w-4" />
                  {resume.originalFileName}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">
                  {resume.extractedName || "Unknown Candidate"}
                </h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p className="inline-flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {resume.extractedEmail || "No email"}
                  </p>
                  <p className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {resume.extractedLocation || "No location"}
                  </p>
                  <p className="inline-flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {resume.currentTitle || "No title"} ·{" "}
                    {resume.experienceYears != null ? `${resume.experienceYears} yrs` : "Exp n/a"}
                  </p>
                  <p className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(resume.createdAt).toLocaleString()}
                  </p>
                </div>
                {resume.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {resume.skills.slice(0, 8).map((skill) => (
                      <span
                        key={`${resume.id}-${skill}`}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#2563eb]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <a
                    href={resume.r2Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#2563eb] hover:underline"
                  >
                    Open Resume
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && totalPages > 1 && (
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
        )}
      </div>
    </div>
  );
}

