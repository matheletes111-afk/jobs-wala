import { redirect } from "next/navigation";
import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatLocation } from "@/lib/utils";
import CompanyLogo from "@/components/CompanyLogo";
import { Briefcase, FileText, User, ChevronRight, Plus, Sparkles } from "lucide-react";
import { computeSkillMatch } from "@/lib/skill-match";

export default async function UserDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ skillsPage?: string; prefPage?: string; page?: string }>;
}) {
  const user = await requireJobSeeker();

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    redirect("/user/profile/create");
  }

  const resolvedSearchParams = await searchParams;
  const currentSkillsPage = Math.max(1, parseInt(resolvedSearchParams.skillsPage || resolvedSearchParams.page || "1", 10));
  const currentPrefPage = Math.max(1, parseInt(resolvedSearchParams.prefPage || "1", 10));

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
      const match = computeSkillMatch(
        [...(job.requiredSkills ?? []), ...(job.secondarySkills ?? [])],
        candidateSkills,
        profile.bio
      );
      const matchPercentage = match.percent || 0;
      return { ...job, matchPercentage, matchedSkills: match.matchedLabels };
    })
    .filter((job) => job.matchPercentage > 0)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  const preferredCategories = profile.preferredCategories || [];
  const preferredJobs = allActiveJobs
    .filter((job) =>
      preferredCategories.some(
        (cat) => cat.toLowerCase() === job.category.toLowerCase()
      )
    )
    .map((job) => {
      const match = computeSkillMatch(
        [...(job.requiredSkills ?? []), ...(job.secondarySkills ?? [])],
        candidateSkills,
        profile.bio
      );
      const matchPercentage = match.percent || 0;
      return { ...job, matchPercentage, matchedSkills: match.matchedLabels };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  const limit = 10;
  const totalMatchedJobs = matchedJobs.length;
  const totalSkillsPages = Math.ceil(totalMatchedJobs / limit);
  const paginatedSkillsJobs = matchedJobs.slice((currentSkillsPage - 1) * limit, currentSkillsPage * limit);

  const totalPreferredJobs = preferredJobs.length;
  const totalPrefPages = Math.ceil(totalPreferredJobs / limit);
  const paginatedPrefJobs = preferredJobs.slice((currentPrefPage - 1) * limit, currentPrefPage * limit);

  return (
    <div className="w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        <div className="mb-8 border-b border-slate-200/60 pb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in duration-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">Overview</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              User Dashboard
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Manage your job search, track applications, and update your profile.
            </p>
          </div>
          <Link href="/user/jobs">
            <Button className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm">
              <Plus className="h-4 w-4 text-white" />
              <span style={{ color: "white" }}>Browse Jobs</span>
            </Button>
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              emerald: "bg-emerald-50 border-emerald-100 text-emerald-600 hover:border-emerald-350",
              amber: "bg-amber-50 border-amber-100 text-amber-600 hover:border-amber-350",
              blue: "bg-blue-50 border-blue-100 text-blue-600 hover:border-blue-350",
              violet: "bg-violet-50 border-violet-100 text-violet-600 hover:border-violet-350",
            };
            const iconBgColors: Record<string, string> = {
              emerald: "bg-emerald-100 text-emerald-600",
              amber: "bg-amber-100 text-amber-650",
              blue: "bg-blue-100 text-blue-600",
              violet: "bg-violet-100 text-violet-600",
            };
            return (
              <Link key={card.label} href={card.href} className="group outline-none">
                <div
                  className={`relative overflow-hidden flex flex-col justify-between h-36 rounded-2xl p-5 border bg-white shadow-sm transition-all duration-300 hover:shadow-md ${colors[card.color]}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl p-2.5 transition-transform group-hover:scale-105 ${iconBgColors[card.color]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                      {card.label}
                    </p>
                    <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{card.subValue}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recommended Jobs Based on Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                  Recommended Jobs for You
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Top opportunities matched based on your profile skills
                </p>
              </div>
            </div>
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {paginatedSkillsJobs.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400 text-xs font-medium italic">
                  No recommended jobs found. Update your profile skills to match with open positions!
                </div>
              ) : (
                paginatedSkillsJobs.map((job, idx) => {
                  const jobSkills = Array.from(new Set([...job.requiredSkills, ...job.secondarySkills]));
                  return (
                    <div
                      key={job.id}
                      className="flex flex-col lg:flex-row lg:items-center gap-4 px-6 py-5 transition-all hover:bg-slate-50/30 group"
                    >
                      <CompanyLogo
                        companyLogo={job.employer.companyLogo}
                        companyName={job.companyName || job.employer.companyName}
                        size="md"
                        className="shrink-0 rounded-xl border border-slate-200 bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/jobs/${job.id}?from=/user/dashboard`}>
                            <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                          </Link>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                            {job.category}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
                          <span>{job.companyName || job.employer.companyName}</span>
                          <span className="text-slate-200">|</span>
                          <span>{formatLocation(job.location)}</span>
                        </div>

                        {/* Skills Match Section */}
                        <div className="mt-3 max-w-md">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-semibold text-slate-400">
                              Skills Match
                            </span>
                            <span className="text-xs font-bold text-orange-500">
                              {job.matchPercentage}% Match
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                job.matchPercentage >= 75
                                  ? "bg-emerald-500"
                                  : job.matchPercentage >= 40
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                              }`}
                              style={{ width: `${job.matchPercentage}%` }}
                            />
                          </div>
                          {/* Matched Skills Preview */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {jobSkills.map((skill) => {
                              const isMatched = job.matchedSkills.some(
                                (ms) => ms.toLowerCase() === skill.toLowerCase()
                              );
                              return (
                                <span
                                  key={skill}
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all ${
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
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        <Link href={`/jobs/${job.id}?from=/user/dashboard`} className="w-full lg:w-auto">
                          <Button className="w-full lg:w-auto h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm">
                            <span style={{ color: "white" }}>Apply Now</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalMatchedJobs > limit && totalSkillsPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 px-6 py-4 border-t border-slate-100">
                <Link
                  href={currentSkillsPage > 1 ? `/user/dashboard?skillsPage=${currentSkillsPage - 1}&prefPage=${currentPrefPage}` : "#"}
                  className={`h-9 px-4 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center transition-all ${
                    currentSkillsPage <= 1 ? "opacity-30 cursor-not-allowed pointer-events-none" : ""
                  }`}
                >
                  Previous Page
                </Link>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalSkillsPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/user/dashboard?skillsPage=${p}&prefPage=${currentPrefPage}`}
                      className={`h-9 w-9 flex items-center justify-center rounded-lg text-xs font-semibold transition-all border ${
                        currentSkillsPage === p
                          ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-505 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
                <Link
                  href={currentSkillsPage < totalSkillsPages ? `/user/dashboard?skillsPage=${currentSkillsPage + 1}&prefPage=${currentPrefPage}` : "#"}
                  className={`h-9 px-4 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center transition-all ${
                    currentSkillsPage >= totalSkillsPages ? "opacity-30 cursor-not-allowed pointer-events-none" : ""
                  }`}
                >
                  Next Page
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Jobs in Your Preferred Categories */}
        {profile.preferredCategories && profile.preferredCategories.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Briefcase className="h-4.5 w-4.5 text-blue-500" />
                  Jobs in Your Preferred Categories
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Active job listings under your selected categories
                </p>
              </div>
            </div>
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {paginatedPrefJobs.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400 text-xs font-medium italic">
                  No jobs found in your preferred categories. Update your preferences to see listings!
                </div>
              ) : (
                paginatedPrefJobs.map((job, idx) => {
                  return (
                    <div
                      key={job.id}
                      className="flex flex-col lg:flex-row lg:items-center gap-4 px-6 py-5 transition-all hover:bg-slate-50/30 group"
                    >
                      <CompanyLogo
                        companyLogo={job.employer.companyLogo}
                        companyName={job.companyName || job.employer.companyName}
                        size="md"
                        className="shrink-0 rounded-xl border border-slate-200 bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/jobs/${job.id}?from=/user/dashboard`}>
                            <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                          </Link>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                            {job.category}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
                          <span>{job.companyName || job.employer.companyName}</span>
                          <span className="text-slate-200">|</span>
                          <span>{formatLocation(job.location)}</span>
                        </div>

                        {job.matchPercentage > 0 && (
                          <div className="mt-3 max-w-sm">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-semibold text-slate-400">
                                Skills Match
                              </span>
                              <span className="text-xs font-bold text-orange-500">
                                {job.matchPercentage}% Match
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                                style={{ width: `${job.matchPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center shrink-0">
                        <Link href={`/jobs/${job.id}?from=/user/dashboard`} className="w-full lg:w-auto">
                          <Button className="w-full lg:w-auto h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm">
                            <span style={{ color: "white" }}>Apply Now</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalPreferredJobs > limit && totalPrefPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 px-6 py-4 border-t border-slate-100">
                <Link
                  href={currentPrefPage > 1 ? `/user/dashboard?skillsPage=${currentSkillsPage}&prefPage=${currentPrefPage - 1}` : "#"}
                  className={`h-9 px-4 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center transition-all ${
                    currentPrefPage <= 1 ? "opacity-30 cursor-not-allowed pointer-events-none" : ""
                  }`}
                >
                  Previous Page
                </Link>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPrefPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/user/dashboard?skillsPage=${currentSkillsPage}&prefPage=${p}`}
                      className={`h-9 w-9 flex items-center justify-center rounded-lg text-xs font-semibold transition-all border ${
                        currentPrefPage === p
                          ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-505 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
                <Link
                  href={currentPrefPage < totalPrefPages ? `/user/dashboard?skillsPage=${currentSkillsPage}&prefPage=${currentPrefPage + 1}` : "#"}
                  className={`h-9 px-4 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center transition-all ${
                    currentPrefPage >= totalPrefPages ? "opacity-30 cursor-not-allowed pointer-events-none" : ""
                  }`}
                >
                  Next Page
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Recent Applications */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Applications</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Status and tracking for your latest submissions
              </p>
            </div>
            <Link href="/user/applications">
              <Button variant="ghost" className="text-xs font-semibold text-blue-600 hover:bg-blue-50 px-4 h-9 rounded-lg border border-slate-200 transition-all shadow-sm">
                View All
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentApplications.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 text-xs font-medium">
                No active applications. Your future starts with the next submission!
              </div>
            ) : (
              recentApplications.map((application, idx) => (
                <Link
                  key={application.id}
                  href="/user/applications"
                  className="flex items-center gap-4 px-6 py-5 transition-all hover:bg-slate-50/30 group"
                >
                  <CompanyLogo
                    companyLogo={application.job.employer.companyLogo}
                    companyName={application.job.companyName || application.job.employer.companyName}
                    size="md"
                    className="shrink-0 rounded-xl border border-slate-200 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {application.job.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
                      <span>{application.job.companyName || application.job.employer.companyName}</span>
                      <span className="text-slate-200">|</span>
                      <span>{formatLocation(application.job.location)}</span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                        {application.job.category}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        Applied {new Date(application.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                        application.status === "SHORTLISTED"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-250"
                          : application.status === "REJECTED"
                            ? "bg-red-50 text-red-600 border-red-250"
                            : "bg-blue-50 text-blue-600 border-blue-250"
                      }`}
                    >
                      {application.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
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

