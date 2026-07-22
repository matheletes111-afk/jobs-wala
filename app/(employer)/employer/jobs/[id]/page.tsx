import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ApplicationActions from "@/components/employer/ApplicationActions";
import SkillMatchBar from "@/components/employer/SkillMatchBar";
import JobDetails from "@/components/user/JobDetails";
import CandidateAvatar from "@/components/CandidateAvatar";
import { computeSkillMatch, skillKeywordMatch } from "@/lib/skill-match";

export default async function EmployerJobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireEmployer();
  const { id } = await params;

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return <div>Please complete your profile first.</div>;
  }

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      employer: true,
      applications: {
        include: {
          jobSeeker: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!job || job.postedBy !== profile.userId) {
    notFound();
  }

  return (
    <div className="w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
          <Link
            href="/employer/jobs"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all shadow-sm active:scale-95 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">← Back to Jobs</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center h-8 px-4 rounded-full text-xs font-bold border ${
                job.status === "ACTIVE"
                  ? "bg-emerald-50 border-emerald-255 text-emerald-600"
                  : job.status === "PENDING"
                  ? "bg-amber-50 border-amber-255 text-amber-600"
                  : job.status === "PAUSED"
                  ? "bg-slate-50 border-slate-255 text-slate-500"
                  : "bg-red-50 border-red-255 text-red-650"
              }`}
            >
              {job.status} STATUS
            </span>
          </div>
        </div>

        <div className="space-y-10">
          <section className="relative">
            <JobDetails
              job={{
                id: job.id,
                title: job.title,
                description: job.description,
                location: job.location,
                category: job.category,
                salaryRange: job.salaryRange,
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                currency: job.currency,
                payType: job.payType,
                employmentType: job.employmentType,
                workMode: job.workMode,
                experienceRequired: job.experienceRequired,
                experienceMin: job.experienceMin,
                experienceMax: job.experienceMax,
                requiredSkills: job.requiredSkills ?? [],
                secondarySkills: job.secondarySkills ?? [],
                createdAt: job.createdAt,
                employer: {
                  companyName: job.companyName || job.employer.companyName,
                  companyLogo: job.employer.companyLogo,
                  website: job.employer.website,
                  description: job.employer.description,
                },
              }}
            />
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                Posted: {new Date(job.createdAt).toLocaleDateString()}
              </span>
              {job.expiresAt && (
                <span className="flex items-center gap-1.5">
                  Expires: {new Date(job.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-650">Applicants</p>
                <h2 className="text-xl font-bold text-slate-800">
                  Candidates
                  {job.applications.length > 0 && <span className="ml-2 text-blue-600 font-medium">({job.applications.length})</span>}
                </h2>
              </div>
            </div>

            {job.applications.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-16 text-center shadow-sm">
                <p className="text-base font-semibold text-slate-400 italic">
                  No applications yet. Your job posting is active.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {job.applications.map((application) => {
                  const skillMatch = computeSkillMatch(
                    [...(job.requiredSkills ?? []), ...(job.secondarySkills ?? [])],
                    application.jobSeeker.skills ?? [],
                    application.jobSeeker.bio
                  );
                  return (
                    <div key={application.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:border-slate-300">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-start gap-4 shrink-0">
                          <CandidateAvatar
                            profileImage={application.jobSeeker.profileImage}
                            firstName={application.jobSeeker.firstName}
                            lastName={application.jobSeeker.lastName}
                            size="md"
                            className="shrink-0 rounded-xl border border-slate-200"
                          />
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                              application.status === "SHORTLISTED"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : application.status === "REJECTED"
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-blue-50 text-blue-600 border-blue-200"
                            }`}
                          >
                            {application.status}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-bold text-slate-800">
                                {application.jobSeeker.firstName}{" "}
                                {application.jobSeeker.lastName}
                              </h3>
                              <p className="text-xs font-semibold text-blue-600 mt-1">
                                {application.jobSeeker.user.email}
                              </p>
                              <p className="text-[11px] font-medium text-slate-400 mt-2">
                                Applied: {new Date(application.appliedAt).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                              <ApplicationActions
                                applicationId={application.id}
                                currentStatus={application.status}
                              />
                              {application.jobSeeker.resumeUrl && (
                                <a
                                  href={application.jobSeeker.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-9 px-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center shadow-sm"
                                >
                                  View Resume
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100">
                            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                              <SkillMatchBar
                                percent={skillMatch.percent}
                                matched={skillMatch.matched}
                                total={skillMatch.total}
                                matchedLabels={skillMatch.matchedLabels}
                                className="max-w-none"
                              />
                              
                              <div className="pt-3 border-t border-slate-200 space-y-3">
                                <div>
                                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Required & Secondary Skills for this Job:</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {[...(job.requiredSkills ?? []), ...(job.secondarySkills ?? [])].map((reqSkill, sIdx) => {
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
                                    {(application.jobSeeker.skills ?? []).map((skill, sIdx) => {
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
                          </div>

                          {application.coverLetter && (
                            <div className="pt-4 border-t border-slate-100">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Cover Letter</p>
                              <div className="rounded-xl bg-slate-50 border border-slate-150 p-4">
                                <p className="whitespace-pre-wrap text-xs text-slate-500 leading-relaxed font-medium italic">
                                  &quot;{application.coverLetter}&quot;
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

