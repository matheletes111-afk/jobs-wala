import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatLocation } from "@/lib/utils";
import {
  Users,
  FileText,
  UserCheck,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanyLogo from "@/components/CompanyLogo";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [usersCount, applicationsCount, employersCount, activeJobsCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.application.count(),
      prisma.user.count({ where: { role: "EMPLOYER" } }),
      prisma.job.count({ where: { status: "ACTIVE" } }),
    ]);

  const recentJobs = await prisma.job.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      employer: { select: { companyName: true, companyLogo: true } },
      _count: { select: { applications: true } },
    },
  });

  const colorCards = [
    {
      label: "Total Users",
      value: usersCount,
      icon: Users,
      href: "/admin/users",
      className: "bg-blue-600 text-white hover:bg-blue-700",
    },
    {
      label: "Open Jobs",
      value: activeJobsCount,
      icon: Clock,
      href: "/admin/jobs",
      className: "bg-violet-600 text-white hover:bg-violet-700",
    },
    {
      label: "Employers",
      value: employersCount,
      icon: UserCheck,
      href: "/admin/users",
      className: "bg-amber-500 text-white hover:bg-amber-600",
    },
    {
      label: "Applications",
      value: applicationsCount,
      icon: FileText,
      href: "/admin/reports",
      className: "bg-emerald-600 text-white hover:bg-emerald-700",
    },
  ];

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50/50">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Welcome to Admin Dashboard
            </h1>
            <p className="mt-1 text-gray-600">
              Track users, jobs, and applications in one place.
            </p>
          </div>
        </div>

        {/* Color cards */}
        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Recent jobs list */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recent Jobs</h2>
                <p className="text-sm text-gray-500">Latest job postings</p>
              </div>
              <Link href="/admin/jobs">
                <Button variant="outline" size="sm" className="gap-1">
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentJobs.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  No jobs posted yet.
                </div>
              ) : (
                recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/admin/jobs/${job.id}`}
                    className="flex flex-wrap items-center gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                  >
                    <CompanyLogo
                      companyLogo={job.employer.companyLogo}
                      companyName={job.employer.companyName}
                      size="sm"
                      className="shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-500">
                        {job.employer.companyName}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {formatLocation(job.location)}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {job.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Posted {new Date(job.createdAt).toLocaleDateString()} ·{" "}
                        {job._count.applications} applications
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        job.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : job.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {job.status === "PAUSED"
                        ? "Paused"
                        : job.status === "CLOSED"
                          ? "Closed"
                          : job.status}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>
      </div>
    </div>
  );
}
