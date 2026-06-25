import { redirect } from "next/navigation";
import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatLocation } from "@/lib/utils";
import CompanyLogo from "@/components/CompanyLogo";
import { Briefcase, FileText, User, ChevronRight, Plus, Sparkles } from "lucide-react";

export default async function UserDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireJobSeeker();

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    redirect("/user/profile/create");
  }

  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));

  const applicationsCount = await prisma.application.count({
    where: { jobSeekerId: user.id },
  });

  const recentApplications = await prisma.application.findMany({
    where: { jobSeekerId: user.id },
    take: 10,
    orderBy: { appliedAt: "desc" },
    include: {
      job: {
        include: {
          employer: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  // Calculate matched jobs based on candidate skills
  const allActiveJobs = await prisma.job.findMany({
    where: {
      status: "ACTIVE",
      employer: { approvalStatus: "APPROVED" }
    },
    include: {
      employer: {
        include: {
          user: true,
        },
      },
    },
  });

  const candidateSkills = profile.skills || [];
  const matchedJobs = allActiveJobs
    .map((job) => {
      const jobSkills = Array.from(new Set([...job.requiredSkills, ...job.secondarySkills]));
      if (jobSkills.length === 0) {
        return { ...job, matchPercentage: 0, matchedSkills: [] };
      }
      const matched = jobSkills.filter((js) =>
        candidateSkills.some(
          (cs) =>
            cs.toLowerCase().includes(js.toLowerCase()) ||
            js.toLowerCase().includes(cs.toLowerCase())
        )
      );
      const matchPercentage = Math.round((matched.length / jobSkills.length) * 100);
      return { ...job, matchPercentage, matchedSkills: matched };
    })
    .filter((job) => job.matchPercentage > 0)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  const limit = 10;
  const totalMatchedJobs = matchedJobs.length;
  const totalPages = Math.ceil(totalMatchedJobs / limit);
  const paginatedJobs = matchedJobs.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-16">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              User Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground font-medium">
              Manage your job search, track applications, and update your profile.
            </p>
          </div>
          <Link href="/user/jobs">
            <Button className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20">
              <Plus className="h-5 w-5 mr-2" />
              Browse Jobs
            </Button>
          </Link>
        </div>

        <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "Profile Status",
              value: profile.resumeUrl ? "Complete" : "Action Needed",
              subValue: profile.resumeUrl ? "Resume Ready" : "Upload Resume",
              icon: User,
              href: "/user/profile",
              color: profile.resumeUrl ? "emerald" : "amber",
            },
            {
              label: "Applications",
              value: applicationsCount,
              subValue: "Active Proposals",
              icon: FileText,
              href: "/user/applications",
              color: "blue",
            },
            {
              label: "Browse Jobs",
              value: "Discover",
              subValue: "New Daily Feed",
              icon: Briefcase,
              href: "/user/jobs",
              color: "violet",
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            const colors: Record<string, string> = {
              emerald:
                "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 hover:scale-105 shadow-xl shadow-emerald-500/20",
              amber:
                "bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 hover:scale-105 shadow-xl shadow-amber-500/20",
              blue: "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0 hover:scale-105 shadow-xl shadow-blue-500/20",
              violet:
                "bg-gradient-to-br from-violet-600 to-purple-600 text-white border-0 hover:scale-105 shadow-xl shadow-violet-500/20",
            };
            return (
              <Link key={card.label} href={card.href} className="group outline-none">
                <div
                  className={`relative overflow-hidden flex flex-col justify-between h-48 rounded-[2rem] p-8 border transition-all duration-500 animate-in zoom-in-95 ${colors[card.color]}`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start justify-between text-white">
                    <div className="rounded-2xl bg-white/20 p-3 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="text-white">
                    <p className="text-xs font-semibold text-white/70 mb-1">
                      {card.label}
                    </p>
                    <p className="text-3xl font-bold text-white">{card.value}</p>
                    <p className="text-xs font-bold text-white/70 mt-1">{card.subValue}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recommended Jobs Based on Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <section className="linear-card rounded-[2.5rem] overflow-hidden mb-16 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <div className="flex items-center justify-between border-b border-white/5 px-8 py-8">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Recommended Jobs for You
                </h2>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Top opportunities matched based on your profile skills
                </p>
              </div>
            </div>
            <div className="divide-y divide-white/5 overflow-x-auto">
              {paginatedJobs.length === 0 ? (
                <div className="px-8 py-20 text-center text-muted-foreground font-medium italic">
                  No recommended jobs found. Update your profile skills to match with open positions!
                </div>
              ) : (
                paginatedJobs.map((job, idx) => {
                  const jobSkills = Array.from(new Set([...job.requiredSkills, ...job.secondarySkills]));
                  return (
                    <div
                      key={job.id}
                      className="flex flex-col lg:flex-row lg:items-center gap-6 px-8 py-8 transition-all hover:bg-white/[0.02] group animate-in slide-in-from-right-4 duration-500"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <CompanyLogo
                        companyLogo={job.employer.companyLogo}
                        companyName={job.companyName || job.employer.companyName}
                        size="md"
                        className="shrink-0 rounded-xl border border-white/10 bg-white/5 group-hover:border-white/20"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link href={`/jobs/${job.id}`}>
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                          </Link>
                          <span className="text-xs font-semibold bg-white/5 px-3 py-1 rounded-full text-foreground/45 leading-none">
                            {job.category}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-sm font-medium text-muted-foreground">
                          <span>{job.companyName || job.employer.companyName}</span>
                          <span className="text-white/10">|</span>
                          <span>{formatLocation(job.location)}</span>
                        </div>

                        {/* Skills Match Section */}
                        <div className="mt-4 max-w-md">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-bold text-muted-foreground flex items-center gap-1">
                              Skills Match
                            </span>
                            <span className="text-sm font-black text-orange-500">
                              {job.matchPercentage}% Match
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden border border-black/5">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                job.matchPercentage >= 75
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                  : job.matchPercentage >= 40
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                  : "bg-gradient-to-r from-blue-500 to-indigo-400"
                              }`}
                              style={{ width: `${job.matchPercentage}%` }}
                            />
                          </div>
                          {/* Matched Skills Preview */}
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {jobSkills.map((skill) => {
                              const isMatched = candidateSkills.some(
                                (cs) =>
                                  cs.toLowerCase().includes(skill.toLowerCase()) ||
                                  skill.toLowerCase().includes(cs.toLowerCase())
                              );
                              return (
                                <span
                                  key={skill}
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                    isMatched
                                      ? "bg-emerald-500/15 text-emerald-700 border-emerald-400"
                                      : "bg-transparent text-muted-foreground/60 border-muted-foreground/20"
                                  }`}
                                >
                                  {skill}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        <Link href={`/jobs/${job.id}`} className="w-full lg:w-auto">
                          <Button className="w-full lg:w-auto h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-500/10">
                            Apply Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 px-8 pb-8 border-t border-white/5 pt-8">
                <Link
                  href={currentPage > 1 ? `/user/dashboard?page=${currentPage - 1}` : "#"}
                  className={`h-10 px-6 rounded-xl text-xs font-semibold flex items-center hover:bg-white/5 transition-all ${
                    currentPage <= 1 ? "opacity-40 cursor-not-allowed pointer-events-none" : "text-muted-foreground/80 hover:text-foreground"
                  }`}
                >
                  ← Previous Page
                </Link>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/user/dashboard?page=${p}`}
                      className={`h-10 w-10 flex items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                        currentPage === p
                          ? "bg-primary text-white shadow-xl shadow-primary/20 border border-primary/40"
                          : "text-muted-foreground/45 hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      {p.toString().padStart(2, "0")}
                    </Link>
                  ))}
                </div>
                <Link
                  href={currentPage < totalPages ? `/user/dashboard?page=${currentPage + 1}` : "#"}
                  className={`h-10 px-6 rounded-xl text-xs font-semibold flex items-center hover:bg-white/5 transition-all ${
                    currentPage >= totalPages ? "opacity-40 cursor-not-allowed pointer-events-none" : "text-muted-foreground/80 hover:text-foreground"
                  }`}
                >
                  Next Page →
                </Link>
              </div>
            )}
          </section>
        )}

        <section className="linear-card rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <div className="flex items-center justify-between border-b border-white/5 px-8 py-8">
            <div>
              <h2 className="text-xl font-bold text-foreground">Recent Applications</h2>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                Status and tracking for your latest submissions
              </p>
            </div>
            <Link href="/user/applications">
              <Button className="text-xs font-semibold text-blue-500 hover:bg-blue-500/5 px-4 h-10 rounded-xl transition-all">
                View All Applications
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-white/5 overflow-x-auto">
            {recentApplications.length === 0 ? (
              <div className="px-8 py-20 text-center text-muted-foreground font-medium">
                No active applications. Your future starts with the next submission!
              </div>
            ) : (
              recentApplications.map((application, idx) => (
                <Link
                  key={application.id}
                  href="/user/applications"
                  className="flex items-center gap-6 px-8 py-6 transition-all hover:bg-white/[0.02] group animate-in slide-in-from-right-4 duration-500"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <CompanyLogo
                    companyLogo={application.job.employer.companyLogo}
                    companyName={application.job.companyName || application.job.employer.companyName}
                    size="md"
                    className="shrink-0 rounded-xl border border-white/10 bg-white/5 group-hover:border-white/20"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {application.job.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-sm font-medium text-muted-foreground">
                      <span>{application.job.companyName || application.job.employer.companyName}</span>
                      <span className="text-white/10">|</span>
                      <span>{formatLocation(application.job.location)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <span className="text-xs font-semibold bg-white/5 px-3 py-1 rounded-full text-foreground/40 leading-none">
                        {application.job.category}
                      </span>
                      <span className="text-xs font-semibold text-foreground/30 leading-none">
                        Applied {new Date(application.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-5 py-2 text-xs font-semibold shadow-xl transition-all ${
                        application.status === "SHORTLISTED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : application.status === "REJECTED"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {application.status}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/40 group-hover:text-foreground transition-colors mr-2">
                      Review Pending
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

