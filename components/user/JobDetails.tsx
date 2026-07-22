import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatLocation, formatSalary, PAY_TYPE_LABELS } from "@/lib/utils";
import CompanyLogo from "@/components/CompanyLogo";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  salaryRange?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  payType?: string | null;
  employmentType: string;
  workMode: string;
  experienceRequired?: number | null;
  experienceMin?: number | null;
  experienceMax?: number | null;
  requiredSkills?: string[];
  secondarySkills?: string[];
  createdAt: Date;
  companyName?: string | null;
  employer: {
    companyName: string;
    companyLogo?: string | null;
    website?: string | null;
    description?: string | null;
  };
}



function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, queries: string[]) {
  if (!text || !queries || queries.length === 0) return text;
  const activeQueries = queries
    .map((q) => q.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (activeQueries.length === 0) return text;

  const escaped = activeQueries.map((q) => escapeRegExp(q));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = activeQueries.some((q) => q.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark key={index} className="bg-lime-400 text-black font-semibold px-1 rounded">
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </>
  );
}

export default function JobDetails({
  job,
  search = "",
  title = "",
  category = "",
  location = "",
  matchScore,
  candidateSkills = [],
}: {
  job: Job;
  search?: string;
  title?: string;
  category?: string;
  location?: string;
  matchScore?: number | null;
  candidateSkills?: string[];
}) {
  const salaryStr = formatSalary(job);
  const hasExperienceRange = job.experienceMin != null || job.experienceMax != null;
  const experienceStr = hasExperienceRange
    ? [job.experienceMin, job.experienceMax].filter((n) => n != null).join(" - ") + " years"
    : `${job.experienceRequired ?? 0} years`;

  const extractLocationTerms = (locationStr: string): string[] => {
    if (!locationStr || !locationStr.trim()) return [];
    try {
      const parsed = JSON.parse(decodeURIComponent(locationStr));
      const terms: string[] = [];
      if (parsed.country) terms.push(parsed.country);
      if (parsed.state) {
        if (Array.isArray(parsed.state)) terms.push(...parsed.state);
        else if (typeof parsed.state === "string") terms.push(parsed.state);
      }
      if (parsed.city) {
        if (Array.isArray(parsed.city)) terms.push(...parsed.city);
        else if (typeof parsed.city === "string") terms.push(parsed.city);
      }
      return terms.map((t) => t.trim()).filter(Boolean);
    } catch {
      return [locationStr.trim()];
    }
  };

  const activeQueries = [
    search,
    title,
    category !== "all" ? category : "",
    ...extractLocationTerms(location),
  ].map((q) => q?.trim()).filter(Boolean);

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-8 animate-in fade-in duration-700">
      {/* Match Score Bar */}
      {matchScore !== undefined && matchScore !== null && (
        <div className="mb-8 p-5 rounded-2xl border border-slate-200 bg-slate-50/50 max-w-xl animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-550 uppercase tracking-wider">
              Profile Match Score
            </span>
            <span className={`text-sm font-extrabold ${
              matchScore >= 75
                ? "text-emerald-600"
                : matchScore >= 40
                ? "text-amber-600"
                : "text-blue-600"
            }`}>
              {matchScore}% Match
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                matchScore >= 75
                  ? "bg-emerald-500"
                  : matchScore >= 40
                  ? "bg-amber-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${matchScore}%` }}
            />
          </div>
          {/* Matched Skills Preview */}
          {(() => {
            const jobSkills = Array.from(new Set([
              ...(job.requiredSkills ?? []),
              ...(job.secondarySkills ?? [])
            ]));
            if (jobSkills.length === 0) return null;
            return (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {jobSkills.map((skill) => {
                  const isMatched = candidateSkills.some(
                    (cs) =>
                      cs.toLowerCase().includes(skill.toLowerCase()) ||
                      skill.toLowerCase().includes(cs.toLowerCase())
                  );
                  return (
                    <span
                      key={skill}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                        isMatched
                          ? "bg-emerald-50 text-emerald-600 border-emerald-250"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-slate-100 pb-8 mb-8">
        <CompanyLogo
          companyLogo={job.employer.companyLogo}
          companyName={job.companyName || job.employer.companyName}
          size="lg"
          className="shrink-0 rounded-2xl border border-slate-200 bg-white"
        />
        <div className="min-w-0 flex-1 text-center md:text-left">
          <p className="text-xs font-semibold text-blue-600 mb-2">Job Listing</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl mb-4">
            {highlightText(job.title, activeQueries)}
          </h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
              {job.companyName || job.employer.companyName}
            </span>
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-blue-50 border border-blue-150 text-xs font-semibold text-blue-600">
              {highlightText(formatLocation(job.location), activeQueries)}
            </span>
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-violet-50 border border-violet-150 text-xs font-semibold text-violet-600">
              {highlightText(job.category, activeQueries)}
            </span>
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-150 text-xs font-semibold text-emerald-600">
              {(job.employmentType || "FULL_TIME").replace("_", " ")}
            </span>
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-orange-50 border border-orange-150 text-xs font-semibold text-orange-650">
              {(job.workMode || "ONSITE").replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-450">Job Description</h3>
            </div>
            <div className="max-w-none">
              <div
                className="text-slate-650 leading-relaxed font-medium text-base
                           [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-1.5
                           [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-1.5
                           [&_p]:mb-4 [&_p]:last:mb-0
                           [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-800 [&_h1]:mt-6 [&_h1]:mb-3
                           [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mt-5 [&_h2]:mb-2
                           [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-800 [&_h3]:mt-4 [&_h3]:mb-2
                           [&_strong]:font-extrabold [&_strong]:text-slate-800"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-y border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Experience Required</h3>
              <p className="text-xl font-bold text-slate-800">{experienceStr}</p>
            </div>
            {salaryStr && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Compensation</h3>
                <p className="text-xl font-bold text-slate-800">{salaryStr}</p>
              </div>
            )}
          </div>

          {(job.requiredSkills?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-55 animate-pulse" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-450">Required Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills!.map((s) => (
                  <span key={s} className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(job.secondarySkills?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-405">Optional Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.secondarySkills!.map((s) => (
                  <span key={s} className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-650">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:pl-8 lg:border-l border-slate-100">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 mb-2">About Company</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">Company Name</p>
                <p className="text-sm font-bold text-slate-800">{job.companyName || job.employer.companyName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">Overview</p>
                <p className="text-xs leading-relaxed text-slate-500 font-medium italic">
                  &quot;{job.employer.description || "Analytical data pending."}&quot;
                </p>
              </div>
              {job.employer.website && (
                <a
                  href={job.employer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-750 transition-colors"
                >
                  Visit Company Website <span>→</span>
                </a>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-blue-700 mb-2">Job Insights</h3>
            <p className="text-xs text-slate-650 leading-relaxed font-medium">
              This job listing is directly from the employer. Candidates with matching profiles and relevant skills are highly encouraged to apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
