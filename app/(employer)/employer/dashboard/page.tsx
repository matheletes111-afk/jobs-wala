import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ApplicationActions from "@/components/employer/ApplicationActions";
import { Briefcase, Clock, FileText, ChevronRight, Plus } from "lucide-react";
import CandidateAvatar from "@/components/CandidateAvatar";

export default async function EmployerDashboardPage() {
  const user = await requireEmployer();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8 lg:py-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-gray-600">Please complete your company profile first.</p>
            <Link href="/employer/profile">
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">Complete Profile</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [jobsCount, applicationsCount, activeJobs] = await Promise.all([
    prisma.job.count({ where: { postedBy: profile.userId } }),
    prisma.application.count({
      where: { job: { postedBy: profile.userId } },
    }),
    prisma.job.count({
      where: { postedBy: profile.userId, status: "ACTIVE" },
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

  const colorCards = [
    {
      label: "Total Jobs",
      value: jobsCount,
      icon: Briefcase,
      href: "/employer/jobs",
      className: "bg-blue-600 text-white hover:bg-blue-700",
    },
    {
      label: "Open Jobs",
      value: activeJobs,
      icon: Clock,
      href: "/employer/jobs",
      className: "bg-violet-600 text-white hover:bg-violet-700",
    },
    {
      label: "Applications",
      value: applicationsCount,
      icon: FileText,
      href: "/employer/applications",
      className: "bg-amber-500 text-white hover:bg-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Welcome to Employer Dashboard
            </h1>
            <p className="mt-1 text-gray-600">
              Track job postings, packages, and CV views in one place.
            </p>
          </div>
          <Link href="/employer/jobs/new">
            <Button className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8]">
              <Plus className="h-4 w-4" />
              Post a Job
            </Button>
          </Link>
        </div>

        {/* Color cards */}
        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {colorCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href}>
                <div
                  className={`flex items-center gap-5 rounded-2xl p-6 shadow-md transition-all ${card.className}`}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-medium opacity-90">{card.label}</p>
                    <p className="text-3xl font-bold">{card.value}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Applications */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
              <p className="text-sm text-gray-500">Latest applications across your jobs</p>
            </div>
            <Link href="/employer/applications">
              <Button variant="outline" size="sm" className="gap-1">
                View all
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentApplications.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No applications yet.
              </div>
            ) : (
              recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <CandidateAvatar
                    profileImage={app.jobSeeker.profileImage}
                    firstName={app.jobSeeker.firstName}
                    lastName={app.jobSeeker.lastName}
                    size="sm"
                    className="shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">{app.job.title}</h3>
                    <p className="text-sm text-gray-500">
                      {app.jobSeeker.firstName} {app.jobSeeker.lastName}
                      {app.jobSeeker.user?.email && (
                        <span className="text-gray-400"> · {app.jobSeeker.user.email}</span>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {app.job.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        app.status === "SHORTLISTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {app.status}
                    </span>
                    <ApplicationActions
                      applicationId={app.id}
                      currentStatus={app.status}
                    />
                    {app.jobSeeker.resumeUrl && (
                      <a
                        href={app.jobSeeker.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="border-[#2563eb] text-[#2563eb] hover:bg-blue-50">
                          View Resume
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
    </div>
  );
}
