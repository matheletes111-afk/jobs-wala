import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ApplicationActions from "@/components/employer/ApplicationActions";
import { Briefcase, Clock, FileText, ChevronRight, Plus, Zap } from "lucide-react";
import CandidateAvatar from "@/components/CandidateAvatar";

export default async function EmployerDashboardPage() {
  const user = await requireEmployer();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { endDate: "desc" },
        include: { plan: true },
        take: 1,
      },
    },
  });

  if (!profile) {
    return (
      <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-16 sm:px-6 md:px-8 lg:px-10 lg:py-24">
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200">
               <Briefcase className="h-9 w-9 text-amber-500" />
            </div>
            <p className="mb-6 text-base font-semibold text-slate-600">Complete your company profile to get started.</p>
            <Link href="/employer/profile">
              <Button className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95">
                <span style={{ color: "white" }}>Complete Your Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [jobsCount, applicationsCount, activeJobs, recentJobs] = await Promise.all([
    prisma.job.count({ where: { postedBy: profile.userId } }),
    prisma.application.count({
      where: { job: { postedBy: profile.userId } },
    }),
    prisma.job.count({
      where: { postedBy: profile.userId, status: "ACTIVE" },
    }),
    prisma.job.findMany({
      where: { postedBy: profile.userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const recentApplications = await prisma.application.findMany({
    where: { job: { postedBy: profile.userId } },
    take: 10,
    orderBy: { appliedAt: "desc" },
    include: {
      job: true,
      jobSeeker: { include: { user: true } },
    },
  });

  const metrics = [
    {
      label: "Active Jobs",
      value: activeJobs,
      icon: Clock,
      description: "Live postings open for applications",
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Total Applications",
      value: applicationsCount,
      icon: FileText,
      description: "Candidates applied across all jobs",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Total Job Listings",
      value: jobsCount,
      icon: Briefcase,
      description: "Total jobs created in portal",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <div className="min-h-screen w-full min-w-0 bg-slate-50/50 text-foreground animate-in fade-in duration-1000">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        {/* Welcome Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Hello, {profile.companyName || user.name || "Employer"}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Here is your recruitment activity at a glance.
            </p>
          </div>
          {profile.approvalStatus === "APPROVED" && (
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/employer/jobs/new">
                <Button className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 transition-all flex items-center gap-2">
                  <Plus className="h-4 w-4" style={{ color: "white" }} />
                  <span style={{ color: "white" }}>Post a Job</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Profile Approval / Warning Banners */}
        {profile.approvalStatus !== "APPROVED" && (
          <div className={`mb-8 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 border animate-in slide-in-from-top-4 duration-700 ${
            profile.approvalStatus === "REJECTED"
              ? "bg-red-50/5 border-red-200 text-red-700"
              : "bg-amber-50/60 border-amber-200 text-amber-800"
          }`}>
            <div className="flex items-center gap-4">
              <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center border ${
                profile.approvalStatus === "REJECTED"
                  ? "bg-red-100 border-red-200 text-red-600"
                  : "bg-amber-100 border-amber-200 text-amber-600"
              }`}>
                <Zap className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight uppercase">
                  {profile.approvalStatus === "REJECTED" ? "Profile Rejected by Admin" : "Identity Verification Pending"}
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {profile.approvalStatus === "REJECTED"
                    ? `Reason: ${profile.rejectionReason || "Please review details."}. Re-submit with corrected details.`
                    : "Your profile is pending administrator approval. Please wait for confirmation."}
                </p>
              </div>
            </div>
            <Link href="/employer/profile">
              <Button className={`h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                profile.approvalStatus === "REJECTED"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              }`}>
                <span style={{ color: "white" }}>
                  {profile.approvalStatus === "REJECTED" ? "Edit Profile" : "Check Profile"}
                </span>
              </Button>
            </Link>
          </div>
        )}

        {/* Flat Metrics Grid */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold tracking-tight text-slate-800">{metric.value}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">{metric.description}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${metric.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 3-Column Structured Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main sections: Left/Middle Columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Job Postings */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-tight text-slate-800">Job Postings</h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Manage and monitor your active listings</p>
                </div>
                <Link href="/employer/jobs" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                  View All Jobs
                  <ChevronRight className="h-4.5 w-4.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentJobs.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-sm font-medium text-slate-400 italic">No job postings created yet.</p>
                  </div>
                ) : (
                  recentJobs.map((job) => (
                    <div key={job.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-all gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                            job.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {job.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{job.category}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold mt-1">Posted on {new Date(job.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/employer/jobs/${job.id}`}>
                          <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-700">
                            Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Recent Applicants Needs Review */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-tight text-slate-800">Recent Candidates</h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Quickly review new candidate profiles</p>
                </div>
                <Link href="/employer/applications" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                  All Applicants
                  <ChevronRight className="h-4.5 w-4.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentApplications.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-sm font-medium text-slate-400 italic">No applications received yet.</p>
                  </div>
                ) : (
                  recentApplications.map((app) => (
                    <div key={app.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-all">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <CandidateAvatar
                          profileImage={app.jobSeeker.profileImage}
                          firstName={app.jobSeeker.firstName}
                          lastName={app.jobSeeker.lastName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <Link href={`/employer/candidates/${app.jobSeeker.id}`} className="hover:underline">
                            <h3 className="text-sm font-semibold text-slate-800">
                              {app.jobSeeker.firstName} {app.jobSeeker.lastName}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            Applied for <span className="font-bold text-slate-700">{app.job.title}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                          app.status === "SHORTLISTED"
                            ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                            : app.status === "REJECTED"
                              ? "bg-red-50 border border-red-100 text-red-700"
                              : "bg-blue-50 border border-blue-100 text-blue-700"
                        }`}>
                          {app.status}
                        </span>
                        <div className="h-9 px-1 rounded-xl bg-slate-50 border border-slate-200 flex items-center">
                          <ApplicationActions applicationId={app.id} currentStatus={app.status} />
                        </div>
                        {app.jobSeeker.resumeUrl && (
                          <a href={app.jobSeeker.resumeUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-700">
                              Resume
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            {/* Subscription Detail Widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Subscription Plan</h3>
              {profile.approvalStatus === "APPROVED" && (
                (!profile.subscriptions[0] || new Date(profile.subscriptions[0].endDate) < new Date()) ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                      <p className="text-xs font-bold text-orange-800">No Active Plan Found</p>
                      <p className="text-[11px] text-orange-600 mt-1">Please subscribe to unlock job posting and candidate resume search features.</p>
                    </div>
                    <Link href="/employer/subscription" className="block w-full">
                      <Button className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-md shadow-orange-500/10">
                        <span style={{ color: "white" }}>View Plans & Pricing</span>
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 uppercase">{profile.subscriptions[0].plan.name}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 border border-blue-200 text-[9px] font-semibold text-blue-700 uppercase">Active</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Expires on {new Date(profile.subscriptions[0].endDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </p>
                    </div>
                    <Link href="/employer/subscription" className="block w-full">
                      <Button variant="outline" className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl">
                        Manage Plan
                      </Button>
                    </Link>
                  </div>
                )
              )}
            </div>

            {/* Quick Tips / Guides Widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Hiring Success Tips</h3>
              <div className="space-y-4 divide-y divide-slate-100">
                <div className="pt-0">
                  <h4 className="text-xs font-bold text-slate-800">Optimize Job Titles</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Keep titles short and clear. Use standard industry terms instead of internal names to attract more relevant applicants.</p>
                </div>
                <div className="pt-4">
                  <h4 className="text-xs font-bold text-slate-800">Target Specific Skills</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Specify key skill keywords when listing jobs to help our matching engine sort the best fit candidates higher.</p>
                </div>
                <div className="pt-4">
                  <h4 className="text-xs font-bold text-slate-800">Prompt Feedback</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Shortlist or reject candidates within 48 hours. Quick responses enhance your employer brand value.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
