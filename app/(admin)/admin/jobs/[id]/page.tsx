import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import JobApprovalActions from "@/components/admin/JobApprovalActions";
import { formatLocation } from "@/lib/utils";
import {
  MapPin,
  Briefcase,
  Calendar,
  Building2,
  Globe,
  Lightbulb,
  Users,
  UserCircle,
  Mail,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import CandidateAvatar from "@/components/CandidateAvatar";
import SkillMatchBar from "@/components/employer/SkillMatchBar";
import { computeSkillMatch, skillKeywordMatch } from "@/lib/skill-match";

const PAY_TYPE_LABELS: Record<string, string> = {
  HOURLY: "Hourly",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function formatSalary(
  salaryMin: number | null,
  salaryMax: number | null,
  currency: string | null,
  payType: string | null,
  salaryRange: string | null
): string | null {
  if (salaryMin != null && salaryMax != null) {
    const curr = currency || "";
    const pay = payType ? PAY_TYPE_LABELS[payType] || payType : "";
    return `${curr} ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}${pay ? ` (${pay})` : ""}`.trim();
  }
  if (salaryRange) return salaryRange;
  return null;
}

export default async function AdminJobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      employer: true,
      _count: {
        select: { applications: true },
      },
      applications: {
        orderBy: { appliedAt: "desc" },
        include: {
          jobSeeker: {
            include: {
              user: { select: { email: true } },
            },
          },
        },
      },
    },
  });

  if (!job) notFound();

  const salaryStr = formatSalary(
    job.salaryMin,
    job.salaryMax,
    job.currency,
    job.payType,
    job.salaryRange
  );
  const hasExperienceRange =
    job.experienceMin != null || job.experienceMax != null;
  const experienceStr = hasExperienceRange
    ? [job.experienceMin, job.experienceMax]
        .filter((n) => n != null)
        .join(" - ") + " years"
    : `${job.experienceRequired ?? 0} years`;

  const statusLabel =
    job.status === "PAUSED"
      ? "Paused"
      : job.status === "CLOSED"
        ? "Closed"
        : job.status;

  const skills = [
    ...(job.requiredSkills ?? []),
    ...(job.secondarySkills ?? []),
  ].filter(Boolean);

  return (
    <div className="w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-5">
              <CompanyLogo
                companyLogo={job.employer.companyLogo}
                companyName={job.companyName || job.employer.companyName}
                size="md"
                className="h-16 w-16 rounded-xl border border-slate-200 bg-white"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                   <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Job Details</p>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-1">
                  {job.title}
                </h1>
                <p className="text-sm font-semibold text-slate-500 mb-4">
                  {job.companyName || job.employer.companyName} {" // "} {job.employer.industry || "Industry Information"}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {formatLocation(job.location)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    POSTED {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-500" />
                    {job._count.applications} Applications
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex shrink-0 flex-col sm:flex-row gap-3">
              <Link href="/admin/jobs">
                <Button variant="ghost" className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all">
                  ← Back to Jobs
                </Button>
              </Link>
              <div className="[&_button]:h-10 [&_button]:px-6 [&_button]:rounded-xl [&_button]:text-xs [&_button]:font-semibold [&_button]:shadow-sm">
                 <JobApprovalActions jobId={job.id} currentStatus={job.status} />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-2.5">
             <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                job.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600 border-emerald-250" : "bg-amber-50 text-amber-600 border-amber-250"
             }`}>{statusLabel} Status</span>
             <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                Type: {(job.employmentType || "FULL_TIME").replace("_", " ")}
             </span>
             <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-650 border border-orange-200">
                Mode: {(job.workMode || "ONSITE").replace("_", " ")}
             </span>
             <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-slate-50 text-slate-505 border border-slate-200 italic">
                Category: {job.category}
             </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3 pb-16">
          <div className="space-y-8 lg:col-span-2">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-450">Job Description</h2>
              </div>
              <div
                className="text-slate-600 font-medium leading-relaxed text-base
                           [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-1.5
                           [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-1.5
                           [&_p]:mb-4 [&_p]:last:mb-0
                           [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-800 [&_h1]:mt-6 [&_h1]:mb-3
                           [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mt-5 [&_h2]:mb-2
                           [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-800 [&_h3]:mt-4 [&_h3]:mb-2
                           [&_strong]:font-extrabold [&_strong]:text-slate-800"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </section>

            {/* Skills Card */}
            {skills.length > 0 && (
              <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-450">Required Skills</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className="rounded-xl px-4 py-2 bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-650">
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Applications List */}
            {job.applications.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-450">Applications ({job.applications.length})</h2>
                </div>
                <div className="grid gap-4">
                  {job.applications.map((app: any, idx: number) => {
                    const skillMatch = computeSkillMatch(
                      [...(job.requiredSkills ?? []), ...(job.secondarySkills ?? [])],
                      app.jobSeeker.skills ?? [],
                      app.jobSeeker.bio
                    );
                    return (
                      <div
                        key={app.id}
                        className="bg-white border border-slate-200 shadow-sm flex flex-col gap-5 rounded-2xl p-6 transition-all hover:border-slate-300"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <CandidateAvatar
                              profileImage={app.jobSeeker.profileImage}
                              firstName={app.jobSeeker.firstName}
                              lastName={app.jobSeeker.lastName}
                              size="md"
                              className="rounded-xl border border-slate-200"
                            />
                            <div>
                              <h4 className="text-lg font-bold text-slate-800">
                                {app.jobSeeker.firstName} {app.jobSeeker.lastName}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                 <p className="text-xs font-semibold text-blue-600 flex items-center gap-1.5">
                                   <Mail className="h-3.5 w-3.5" />
                                   {app.jobSeeker.user.email}
                                 </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                                app.status === "SHORTLISTED" ? "bg-emerald-50 text-emerald-600 border-emerald-250" : app.status === "REJECTED" ? "bg-red-50 text-red-600 border-red-250" : "bg-slate-50 text-slate-500 border-slate-200"
                             }`}>
                               {app.status}
                             </span>
                             {app.jobSeeker.resumeUrl && (
                               <a
                                 href={app.jobSeeker.resumeUrl}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all shadow-sm active:scale-95"
                               >
                                 View Resume
                               </a>
                             )}
                             <Link href={`/admin/users/${app.jobSeeker.userId}`}>
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all active:scale-95">
                                  <UserCircle className="h-4 w-4" />
                                </Button>
                             </Link>
                          </div>
                        </div>

                        {app.jobSeeker.jobTitle && (
                          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider italic">
                               {app.jobSeeker.jobTitle} {" // "} {app.jobSeeker.experience != null ? `${app.jobSeeker.experience}Y Experience` : "N/A Experience"}
                             </p>
                          </div>
                        )}

                        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-slate-800">
                          <SkillMatchBar
                            percent={skillMatch.percent}
                            matched={skillMatch.matched}
                            total={skillMatch.total}
                            matchedLabels={skillMatch.matchedLabels}
                            className="max-w-none text-slate-850"
                          />
                          
                          <div className="pt-3 border-t border-slate-200 space-y-3">
                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Required & Secondary Skills for this Job:</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {[...(job.requiredSkills ?? []), ...(job.secondarySkills ?? [])].map((reqSkill: string, sIdx: number) => {
                                  const matched = skillMatch.matchedLabels.some(l => l.toLowerCase() === reqSkill.toLowerCase());
                                  return (
                                    <span
                                      key={sIdx}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                                        matched
                                          ? "bg-emerald-55/10 border-emerald-200 text-emerald-700"
                                          : "bg-slate-100 border-slate-200/60 text-slate-450"
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
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Candidate's Full Profile Skills:</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {(app.jobSeeker.skills ?? []).map((skill: string, sIdx: number) => {
                                  const isReq = [...(job.requiredSkills ?? []), ...(job.secondarySkills ?? [])].some(r => skillKeywordMatch(r, skill));
                                  return (
                                    <span
                                      key={sIdx}
                                      className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border ${
                                        isReq 
                                          ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                                          : "bg-slate-100 border-slate-200 text-slate-650"
                                      }`}
                                    >
                                      {skill} {isReq && <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider ml-1">(Matched)</span>}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {app.coverLetter && (
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 italic">
                            <FileText className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                            <p className="text-xs text-slate-500 leading-relaxed max-w-none font-medium">&quot;{app.coverLetter}&quot;</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-450">Job Overview</h2>
              </div>
              
              <div className="space-y-6">
                 <div className="flex items-start gap-3.5">
                    <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                       <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Company</p>
                        <p className="text-base font-bold text-slate-800">{job.companyName || job.employer.companyName}</p>
                    </div>
                 </div>
                 
                 <div className="flex items-start gap-3.5">
                    <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                       <Lightbulb className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Experience</p>
                        <p className="text-base font-bold text-slate-800">{experienceStr}</p>
                    </div>
                 </div>

                 {salaryStr && (
                   <div className="flex items-start gap-3.5">
                      <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                         <Briefcase className="h-4.5 w-4.5" />
                      </div>
                      <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Salary</p>
                          <p className="text-base font-bold text-slate-800">{salaryStr}</p>
                      </div>
                   </div>
                 )}

                 <div className="flex items-start gap-3.5 pt-6 border-t border-slate-100">
                    <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                       <Globe className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">About Company</p>
                        <p className="text-xs font-medium text-slate-550 italic line-clamp-3 mb-2.5">
                           {job.employer.description || "No description provided."}
                        </p>
                        {job.employer.website && (
                           <Link
                             href={job.employer.website.startsWith("http") ? job.employer.website : `https://${job.employer.website}`}
                             target="_blank"
                             className="text-xs font-semibold text-blue-600 hover:text-blue-755 transition-colors flex items-center gap-1"
                           >
                              Website <span>→</span>
                           </Link>
                        )}
                    </div>
                 </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
