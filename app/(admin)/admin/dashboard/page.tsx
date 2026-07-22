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
  Zap,
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

  const allSubscribers = await prisma.subscription.findMany({
    include: { plan: true }
  });
  const totalRevenue = allSubscribers.reduce((sum: number, sub: any) => sum + sub.plan.amount, 0);

  const recentJobs = await prisma.job.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      employer: { select: { companyName: true, companyLogo: true } },
      _count: { select: { applications: true } },
    },
  });

  const metrics = [
    {
      label: "Total Users",
      value: usersCount,
      icon: Users,
      href: "/admin/users",
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Open Jobs",
      value: activeJobsCount,
      icon: Clock,
      href: "/admin/jobs",
      color: "text-violet-600 bg-violet-50 border-violet-100",
    },
    {
      label: "Employers",
      value: employersCount,
      icon: UserCheck,
      href: "/admin/users",
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      label: "Applications",
      value: applicationsCount,
      icon: FileText,
      href: "/admin/reports",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Total Revenue",
      value: `${totalRevenue.toLocaleString()} INR`,
      icon: Zap,
      href: "/admin/plans",
      color: "text-orange-600 bg-orange-50 border-orange-100",
    },
  ];

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-8 border-b border-slate-200/60 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">Admin Dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Platform <span className="text-blue-600">Overview</span>
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Monitor system metrics, user engagement, and platform activity.
          </p>
        </div>

        {/* Flat Metrics Grid */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <Link key={metric.label} href={metric.href} className="group outline-none block">
                <div
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between h-36 shadow-sm transition-all duration-300 hover:shadow-md"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${metric.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold tracking-tight text-slate-800">{metric.value}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent jobs list */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">Recent Activity</p>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Latest Jobs</h2>
            </div>
            <Link href="/admin/jobs">
              <Button className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 transition-colors">
                <span style={{ color: "white" }}>View All Jobs</span>
              </Button>
            </Link>
          </div>

          <div>
            {recentJobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-400 italic">
                  No recent job activity detected.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentJobs.map((job: any, idx: number) => (
                  <div
                    key={job.id}
                    className="group bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all duration-300"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <CompanyLogo
                          companyLogo={job.employer.companyLogo}
                          companyName={job.companyName || job.employer.companyName}
                          size="md"
                          className="shrink-0 rounded-xl border border-slate-200 bg-white transition-transform group-hover:scale-105"
                        />
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider border ${
                            job.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : job.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <Link href={`/admin/jobs/${job.id}`}>
                          <h3 className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors truncate">
                            {job.title}
                          </h3>
                        </Link>
                        <p className="text-xs font-medium text-slate-500">
                          {job.companyName || job.employer.companyName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-1 text-[9px] font-semibold text-slate-600">
                          {formatLocation(job.location)}
                        </span>
                        <span className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-1 text-[9px] font-semibold text-blue-600">
                          {job.category}
                        </span>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold">
                        <p className="text-slate-400">
                          Posted {new Date(job.createdAt).toLocaleDateString("en-GB")}
                        </p>
                        <p className="text-blue-600">
                          {job._count.applications} Applicants
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
