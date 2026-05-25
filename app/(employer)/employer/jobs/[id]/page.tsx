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
import { computeSkillMatch } from "@/lib/skill-match";

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
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 md:px-8 lg:px-10 lg:py-20">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-6">
          <Link
            href="/employer/jobs"
            className="inline-flex items-center gap-3 h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/10 transition-all active:scale-95 group"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="group-hover:-translate-x-1 transition-transform">← Back to Jobs</span>
          </Link>
          
          <div className="flex items-center gap-4">
             <Badge
              className={`h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${
                job.status === "ACTIVE"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : job.status === "PENDING"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : job.status === "PAUSED"
                  ? "bg-slate-500/10 border-slate-500/20 text-slate-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {job.status} STATUS
            </Badge>
          </div>
        </div>

        <div className="space-y-20">
          <section className="relative">
             <div className="absolute -top-24 -left-24 h-96 w-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
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
                  companyName: job.employer.companyName,
                  companyLogo: job.employer.companyLogo,
                  website: job.employer.website,
                  description: job.employer.description,
                },
              }}
            />
            <div className="mt-8 flex flex-wrap gap-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
              <span className="flex items-center gap-2">
                 <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                 Posted: {new Date(job.createdAt).toLocaleDateString()}
              </span>
              {job.expiresAt && (
                <span className="flex items-center gap-2">
                   <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                   Expires: {new Date(job.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </section>

          <section className="space-y-12">
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/5 pb-10">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Applicants</p>
                <h2 className="text-3xl font-black text-foreground lg:text-5xl tracking-tighter">
                  Candidates
                  {job.applications.length > 0 && <span className="ml-4 text-primary opacity-50">[{job.applications.length}]</span>}
                </h2>
              </div>
            </div>

            {job.applications.length === 0 ? (
              <div className="linear-card rounded-[3rem] p-24 text-center border-dashed border-white/10 bg-white/[0.01]">
                <p className="text-xl font-black text-muted-foreground/40 uppercase tracking-widest italic leading-relaxed">
                  No applications yet.<br />Your job posting is active.
                </p>
              </div>
            ) : (
              <div className="grid gap-8">
                {job.applications.map((application) => {
                  const skillMatch = computeSkillMatch(
                    job.requiredSkills ?? [],
                    application.jobSeeker.skills ?? []
                  );
                  return (
                    <div key={application.id} className="linear-card rounded-[2.5rem] bg-white/[0.02] border-white/5 p-8 sm:p-10 transition-all hover:bg-white/[0.04] animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex flex-col lg:flex-row gap-10">
                        <div className="flex flex-col items-center gap-4 shrink-0">
                           <CandidateAvatar
                            profileImage={application.jobSeeker.profileImage}
                            firstName={application.jobSeeker.firstName}
                            lastName={application.jobSeeker.lastName}
                            size="lg"
                            className="shrink-0 rounded-[1.5rem] border-2 border-white/10 shadow-2xl transition-transform hover:scale-110"
                          />
                          <Badge
                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              application.status === "SHORTLISTED"
                                ? "bg-primary/20 text-primary border-primary/30"
                                : application.status === "REJECTED"
                                ? "bg-red-500/20 text-red-500 border-red-500/30"
                                : "bg-white/5 text-muted-foreground border-white/10"
                            }`}
                          >
                            {application.status}
                          </Badge>
                        </div>

                        <div className="min-w-0 flex-1 space-y-8">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                            <div>
                               <h3 className="text-2xl font-black text-foreground tracking-tight sm:text-3xl">
                                {application.jobSeeker.firstName}{" "}
                                {application.jobSeeker.lastName}
                              </h3>
                              <p className="mt-2 text-sm font-bold text-primary italic opacity-80">
                                {application.jobSeeker.user.email}
                              </p>
                              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                                Applied: {new Date(application.appliedAt).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-3">
                               <ApplicationActions
                                applicationId={application.id}
                                currentStatus={application.status}
                              />
                               {application.jobSeeker.resumeUrl && (
                                <a
                                  href={application.jobSeeker.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center"
                                >
                                  View Resume
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="pt-8 border-t border-white/5">
                             <div className="max-w-xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3 italic">Skill Match</p>
                                <SkillMatchBar
                                  percent={skillMatch.percent}
                                  matched={skillMatch.matched}
                                  total={skillMatch.total}
                                  matchedLabels={skillMatch.matchedLabels}
                                />
                             </div>
                          </div>

                          {application.coverLetter && (
                            <div className="pt-8 border-t border-white/5">
                               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4 italic">Cover Letter</p>
                               <div className="rounded-[1.5rem] bg-white/5 border border-white/5 p-6 sm:p-8">
                                  <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed font-medium italic">
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

