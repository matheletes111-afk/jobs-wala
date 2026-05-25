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
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      {/* Hero Banner */}
      <div className="relative h-64 overflow-hidden rounded-b-[3rem] bg-white/[0.02] border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%232563eb%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
      </div>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 -mt-32 relative z-10 sm:px-6 md:px-8 lg:px-10">
        <div className="linear-card group rounded-[3rem] bg-background/80 border border-white/10 p-10 shadow-2xl backdrop-blur-3xl">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-8">
              <CompanyLogo
                companyLogo={job.employer.companyLogo}
                companyName={job.employer.companyName}
                size="lg"
                className="h-24 w-24 rounded-3xl border-2 border-white/10 shadow-2xl transition-transform group-hover:scale-105"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Job Details</p>
                </div>
                <h1 className="text-3xl font-black md:text-5xl tracking-tighter leading-tight mb-2 text-gradient">
                  {job.title}
                </h1>
                <p className="text-lg font-medium text-muted-foreground italic mb-6">
                  {job.employer.companyName} {" // "} {job.employer.industry || "Industry Information"}
                </p>
                
                <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 tabular-nums">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    {formatLocation(job.location)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    POSTED {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    {job._count.applications} Applications
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex shrink-0 flex-col sm:flex-row gap-3">
              <Link href="/admin/jobs">
                <Button variant="ghost" className="h-14 px-8 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 transition-all">
                  ← Back to Jobs
                </Button>
              </Link>
              <div className="[&_button]:h-14 [&_button]:px-10 [&_button]:rounded-2xl [&_button]:text-[10px] [&_button]:font-black [&_button]:uppercase [&_button]:tracking-widest [&_button]:shadow-xl">
                 <JobApprovalActions jobId={job.id} currentStatus={job.status} />
              </div>
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-white/5 flex flex-wrap gap-3">
             <span className={`rounded-full px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] border transition-colors ${
                job.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
             }`}>{statusLabel} Status</span>
             <span className="rounded-full px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Type: {(job.employmentType || "FULL_TIME").replace("_", " ")}
             </span>
             <span className="rounded-full px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Mode: {(job.workMode || "ONSITE").replace("_", " ")}
             </span>
             <span className="rounded-full px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 text-muted-foreground/60 border border-white/10 italic">
                Category: {job.category}
             </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-12 grid gap-10 lg:grid-cols-3 pb-20">
          <div className="space-y-10 lg:col-span-2">
            {/* Description Card */}
            <section className="linear-card rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Job Description</h2>
              </div>
              <p className="whitespace-pre-wrap text-muted-foreground font-medium italic leading-relaxed text-lg">
                {job.description}
              </p>
            </section>

            {/* Skills Card */}
            {skills.length > 0 && (
              <section className="linear-card rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Required Skills</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className="rounded-xl px-5 py-2 bg-blue-500/5 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-500/80">
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Applications List */}
            {job.applications.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-3 px-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Applications ({job.applications.length})</h2>
                </div>
                <div className="grid gap-4">
                  {job.applications.map((app, idx) => (
                    <div
                      key={app.id}
                      className="linear-card group flex flex-col gap-6 rounded-[2.25rem] bg-white/[0.01] border border-white/5 p-8 transition-all hover:bg-white/[0.04] animate-in fade-in slide-in-from-right-4 duration-500"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <CandidateAvatar
                            profileImage={app.jobSeeker.profileImage}
                            firstName={app.jobSeeker.firstName}
                            lastName={app.jobSeeker.lastName}
                            size="md"
                            className="rounded-2xl border border-white/10"
                          />
                          <div>
                            <h4 className="text-xl font-black text-foreground tracking-tight group-hover:text-blue-500 transition-colors">
                              {app.jobSeeker.firstName} {app.jobSeeker.lastName}
                            </h4>
                            <div className="flex items-center gap-3 mt-1.5">
                               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic tabular-nums flex items-center gap-2">
                                 <Mail className="h-3.5 w-3.5" />
                                 {app.jobSeeker.user.email}
                               </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                           <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-colors ${
                              app.status === "SHORTLISTED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : app.status === "REJECTED" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-muted-foreground/40 border-white/10"
                           }`}>
                             {app.status}
                           </span>
                           <Link href={`/admin/users/${app.jobSeeker.userId}`}>
                              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/20 transition-all active:scale-95">
                                <UserCircle className="h-4 w-4" />
                              </Button>
                           </Link>
                        </div>
                      </div>

                      {app.jobSeeker.jobTitle && (
                        <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5">
                           <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                             {app.jobSeeker.jobTitle} {" // "} {app.jobSeeker.experience != null ? `${app.jobSeeker.experience}Y Experience` : "N/A Experience"}
                           </p>
                        </div>
                      )}
                      
                      {app.coverLetter && (
                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 italic">
                          <FileText className="h-4 w-4 shrink-0 text-blue-500 opacity-40" />
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 font-medium">&quot;{app.coverLetter}&quot;</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-10">
            <section className="linear-card rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 shadow-xl">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-foreground">Job Overview</h2>
              </div>
              
              <div className="space-y-10">
                 <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-blue-500/40 shrink-0">
                       <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">Company</p>
                        <p className="text-lg font-black text-foreground tracking-tight">{job.employer.companyName}</p>
                    </div>
                 </div>
                 
                 <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-blue-500/40 shrink-0">
                       <Lightbulb className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">Experience</p>
                        <p className="text-lg font-black text-foreground tracking-tight tabular-nums">{experienceStr}</p>
                    </div>
                 </div>

                 {salaryStr && (
                   <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-blue-500/40 shrink-0">
                         <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">Salary</p>
                          <p className="text-lg font-black text-foreground tracking-tight tabular-nums">{salaryStr}</p>
                      </div>
                   </div>
                 )}

                 <div className="flex items-start gap-4 pt-10 border-t border-white/5">
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-blue-500/40 shrink-0">
                       <Globe className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">About Company</p>
                        <p className="text-sm font-medium text-muted-foreground italic line-clamp-2 mb-4">
                           {job.employer.description || "No description provided."}
                        </p>
                        {job.employer.website && (
                           <Link
                             href={job.employer.website.startsWith("http") ? job.employer.website : `https://${job.employer.website}`}
                             target="_blank"
                             className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-2"
                           >
                              Website <Globe className="h-3 w-3" />
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
