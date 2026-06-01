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
  employer: {
    companyName: string;
    companyLogo?: string | null;
    website?: string | null;
    description?: string | null;
  };
}



export default function JobDetails({ job }: { job: Job }) {
  const salaryStr = formatSalary(job);
  const hasExperienceRange = job.experienceMin != null || job.experienceMax != null;
  const experienceStr = hasExperienceRange
    ? [job.experienceMin, job.experienceMax].filter((n) => n != null).join(" - ") + " years"
    : `${job.experienceRequired ?? 0} years`;

  return (
    <div className="linear-card rounded-[2.5rem] p-10 sm:p-14 animate-in fade-in slide-in-from-bottom-5 duration-1000">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-10 border-b border-white/5 pb-10 mb-10">
        <CompanyLogo
          companyLogo={job.employer.companyLogo}
          companyName={job.employer.companyName}
          size="lg"
          className="shrink-0 rounded-[1.5rem] border border-white/10 shadow-2xl scale-125 md:scale-100 bg-white/5"
        />
        <div className="min-w-0 flex-1 text-center md:text-left">
          <p className="text-xs font-semibold text-primary mb-3">Job Listing</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-6xl mb-6">
            {job.title}
          </h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700">
              {job.employer.companyName}
            </span>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-55 border border-blue-200 text-xs font-semibold text-blue-700">
              {formatLocation(job.location)}
            </span>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-xs font-semibold text-violet-700">
              {job.category}
            </span>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
              {(job.employmentType || "FULL_TIME").replace("_", " ")}
            </span>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-55 border border-orange-200 text-xs font-semibold text-orange-700">
              {(job.workMode || "ONSITE").replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-16 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-16">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-sm font-semibold text-foreground">Job Description</h3>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed font-medium text-lg">
                {job.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 py-10 border-y border-white/5">
            <div>
              <h3 className="text-xs font-semibold text-primary mb-3">Experience Required</h3>
              <p className="text-2xl font-bold text-foreground">{experienceStr}</p>
            </div>
            {salaryStr && (
              <div>
                <h3 className="text-xs font-semibold text-primary mb-3">Compensation</h3>
                <p className="text-2xl font-bold text-foreground">{salaryStr}</p>
              </div>
            )}
          </div>

          {(job.requiredSkills?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-semibold text-foreground">Required Skills</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {job.requiredSkills!.map((s) => (
                  <span key={s} className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-800 shadow-xl shadow-emerald-500/5">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(job.secondarySkills?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                <h3 className="text-sm font-semibold text-muted-foreground">Optional Skills</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {job.secondarySkills!.map((s) => (
                  <span key={s} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-10 lg:pl-10 lg:border-l border-white/5">
          <div className="linear-card rounded-[2rem] p-8 border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-foreground mb-6">About Company</h3>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Company Name</p>
                <p className="text-sm font-bold text-foreground">{job.employer.companyName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Overview</p>
                <p className="text-sm leading-relaxed text-muted-foreground font-medium italic">
                  &quot;{job.employer.description || "Analytical data pending."}&quot;
                </p>
              </div>
              {job.employer.website && (
                <a
                  href={job.employer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 group text-xs font-semibold text-primary hover:text-blue-400 transition-colors"
                >
                  Visit Company Website <span className="group-hover:translate-x-1 transition-transform">→</span>
                </a>
              )}
            </div>
          </div>

          <div className="linear-card rounded-[2rem] p-8 bg-blue-500/5 border-blue-500/20">
            <h3 className="text-sm font-semibold text-blue-400 mb-4">Job Insights</h3>
            <p className="text-xs text-muted-foreground leading-loose font-medium">
              This job listing is directly from the employer. Candidates with matching profiles and relevant skills are highly encouraged to apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
