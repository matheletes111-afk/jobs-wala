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

  // Actually, simpler to just get all subscriptions and sum in JS for accuracy across plans
  const allSubscribers = await prisma.subscription.findMany({
    include: { plan: true }
  });
  const totalRevenue = allSubscribers.reduce((sum, sub) => sum + sub.plan.amount, 0);

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
      accent: "blue",
    },
    {
      label: "Open Jobs",
      value: activeJobsCount,
      icon: Clock,
      href: "/admin/jobs",
      accent: "violet",
    },
    {
      label: "Employers",
      value: employersCount,
      icon: UserCheck,
      href: "/admin/users",
      accent: "amber",
    },
    {
      label: "Applications",
      value: applicationsCount,
      icon: FileText,
      href: "/admin/reports",
      accent: "emerald",
    },
    {
      label: "Total Revenue",
      value: `${totalRevenue.toLocaleString()} INR`,
      icon: Zap,
      href: "/admin/plans",
      accent: "orange",
    },
  ];

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 md:px-8 lg:px-10 lg:py-20">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Admin Dashboard</p>
          </div>
          <h1 className="text-4xl font-black md:text-6xl tracking-tighter text-foreground">
            Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Overview</span>
          </h1>
          <p className="mt-4 text-lg font-medium text-muted-foreground/60 italic">
            Monitor system metrics, user engagement, and platform activity.
          </p>
        </div>

        {/* Intelligence Nodes - Color cards */}
        <div className="mb-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {colorCards.map((card, idx) => {
            const Icon = card.icon;
            const accentColors = {
              blue: "bg-blue-200 text-blue-950 border-blue-400 shadow-md hover:bg-blue-300 hover:shadow-lg",
              violet: "bg-violet-200 text-violet-950 border-violet-400 shadow-md hover:bg-violet-300 hover:shadow-lg",
              amber: "bg-amber-200 text-amber-950 border-amber-400 shadow-md hover:bg-amber-300 hover:shadow-lg",
              emerald: "bg-emerald-200 text-emerald-950 border-emerald-400 shadow-md hover:bg-emerald-300 hover:shadow-lg",
              orange: "bg-orange-200 text-orange-950 border-orange-400 shadow-md hover:bg-orange-300 hover:shadow-lg",
            };
            const colorClass = accentColors[card.accent as keyof typeof accentColors];

            return (
              <Link key={card.label} href={card.href} className="group outline-none">
                <div
                  className={`relative flex flex-col justify-between h-48 rounded-[2rem] p-8 border transition-all duration-500 animate-in zoom-in-95 cursor-pointer ${colorClass}`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-2xl bg-black/5 p-3 group-hover:scale-110 transition-transform">
                      <Icon className="h-7 w-7" />
                    </div>
                    <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-1">{card.label}</p>
                    <p className="text-4xl font-black tracking-tighter text-black">{card.value}</p>
                    <p className="text-[10px] font-bold text-slate-700 mt-1 italic uppercase tracking-widest">Metric</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent jobs list */}
        <section className="space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-black/10 pb-10">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
                Recent Activity
              </p>
              <h2 className="text-3xl font-black text-foreground lg:text-5xl tracking-tighter">
                Latest Jobs
              </h2>
            </div>
            <Link href="/admin/jobs">
              <Button className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 group">
                View All Jobs
                <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6">
            {recentJobs.length === 0 ? (
              <div className="linear-card rounded-[2.5rem] px-6 py-24 text-center border-dashed border-black/10">
                <p className="text-lg font-black text-muted-foreground/40 uppercase tracking-widest italic" >
                  No recent job activity detected.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentJobs.map((job, idx) => (
                  <Link
                    key={job.id}
                    href={`/admin/jobs/${job.id}`}
                    className="group flex flex-col rounded-[2.5rem] p-8 transition-all hover:bg-[#e0f2fe]/90 animate-in fade-in slide-in-from-bottom-5 duration-700 h-full hover:-translate-y-1.5"
                    style={{
                      background: "rgba(224, 242, 254, 0.75)",
                      border: "1px solid #93c5fd",
                      boxShadow: "0 12px 30px -5px rgba(37, 99, 235, 0.08), 0 8px 16px -6px rgba(37, 99, 235, 0.08)",
                      animationDelay: `${idx * 150}ms`
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <CompanyLogo
                        companyLogo={job.employer.companyLogo}
                        companyName={job.companyName || job.employer.companyName}
                        size="md"
                        className="shrink-0 rounded-2xl border border-black/10 bg-white transition-transform group-hover:scale-110"
                      />
                      <span
                        className={`shrink-0 rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border ${
                          job.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : job.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-black/5 text-muted-foreground border-black/10"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-4">
                      <h3 className="text-xl font-black text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-sm font-bold text-muted-foreground/60 italic">
                        {job.companyName || job.employer.companyName}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="rounded-xl bg-black/5 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-foreground/80">
                          {formatLocation(job.location)}
                        </span>
                        <span className="rounded-xl bg-blue-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-blue-500 border border-blue-500/20">
                          {job.category}
                        </span>
                      </div>

                      <div className="pt-6 border-t border-black/10 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 italic">
                          Date {new Date(job.createdAt).toLocaleDateString("en-GB")}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                          {job._count.applications} Applications
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
