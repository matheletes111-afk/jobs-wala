import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ApplicationActions from "@/components/employer/ApplicationActions";
import { Briefcase, Clock, FileText, ChevronRight, Plus, Zap } from "lucide-react";
import CandidateAvatar from "@/components/CandidateAvatar";

export default async function EmployerDashboardPage() {
  const user = await requireEmployer();

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  });

    if (!profile) {
      return (
        <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground">
          <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-16 sm:px-6 md:px-8 lg:px-10 lg:py-24">
            <div className="linear-card rounded-[2.5rem] p-12 text-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/20">
                 <Briefcase className="h-10 w-10 text-amber-500 animate-pulse" />
              </div>
              <p className="mb-8 text-xl font-bold text-muted-foreground italic">Operation Pending: Identity Authentication Required</p>
              <Link href="/employer/profile">
                <Button className="h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                  Complete Your Profile
                </Button>
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
        accent: "blue",
        glow: "shadow-blue-500/10",
      },
      {
        label: "Active Jobs",
        value: activeJobs,
        icon: Clock,
        href: "/employer/jobs",
        accent: "violet",
        glow: "shadow-violet-500/10",
      },
      {
        label: "Total Applications",
        value: applicationsCount,
        icon: FileText,
        href: "/employer/applications",
        accent: "emerald",
        glow: "shadow-emerald-500/10",
      },
    ];

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 md:px-8 lg:px-10 lg:py-16">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-3">Dashboard Overview</p>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Employer <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Portal</span>
            </h1>
            <p className="mt-2 text-muted-foreground font-medium max-w-lg">
              Manage your job listings, track candidate applications, and oversee your recruitment process from one place.
            </p>
          </div>

        {/* Subscription Warning Banner */}
        {(!profile.subscriptions[0] || new Date(profile.subscriptions[0].endDate) < new Date()) ? (
          <div className="mb-12 rounded-[2rem] bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 shrink-0 rounded-3xl bg-orange-500/20 flex items-center justify-center border border-orange-500/20">
                <Zap className="h-8 w-8 text-orange-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Active Plan Required</h3>
                <p className="mt-1 text-sm font-medium text-white/50 italic">You don&apos;t have an active subscription. Subscribe now to post jobs and search candidates.</p>
              </div>
            </div>
            <Link href="/employer/subscription">
              <Button className="h-12 px-8 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 transition-all active:scale-95">
                Browse Plans
              </Button>
            </Link>
          </div>
        ) : new Date(profile.subscriptions[0].endDate) < new Date(now + 3 * 24 * 60 * 60 * 1000) && (
          <div className="mb-12 rounded-[2rem] bg-blue-500/5 border border-blue-500/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-700">
             <div className="flex items-center gap-6">
              <div className="h-16 w-16 shrink-0 rounded-3xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                <Clock className="h-8 w-8 text-blue-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Plan Expiring Soon</h3>
                <p className="mt-1 text-sm font-medium text-white/50 italic">Your current plan will expire on {new Date(profile.subscriptions[0].endDate).toLocaleDateString()}. Renew now to avoid interruption.</p>
              </div>
            </div>
            <Link href="/employer/subscription">
              <Button className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                Renew Plan
              </Button>
            </Link>
          </div>
        )}
          <Link href="/employer/jobs/new">
            <Button className="h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 gap-3">
              <Plus className="h-5 w-5" />
              Post a New Job
            </Button>
          </Link>
        </div>

        {/* Color cards */}
        <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {colorCards.map((card, idx) => {
            const Icon = card.icon;
            const accentColors = {
              blue: "bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl shadow-blue-500/30",
              violet: "bg-gradient-to-br from-violet-500 to-indigo-700 shadow-xl shadow-violet-500/30",
              emerald: "bg-gradient-to-br from-emerald-500 to-teal-700 shadow-xl shadow-emerald-500/30",
            };
            const colorClass = accentColors[card.accent as keyof typeof accentColors];

            return (
              <Link key={card.label} href={card.href} className="group outline-none">
                <div
                  className={`relative flex flex-col justify-between h-48 rounded-[2.5rem] p-8 text-white border-0 transition-all duration-300 hover:scale-[1.03] animate-in zoom-in-95 cursor-pointer ${colorClass}`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-2xl bg-white/20 p-3 group-hover:scale-110 transition-transform">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/70 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">{card.label}</p>
                    <p className="text-5xl font-black tracking-tighter text-white">{card.value}</p>
                    <p className="text-xs font-bold text-white/60 mt-1">Manage your {card.label.toLowerCase()}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Applications */}
        <section className="linear-card rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 p-10 gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Recent Applications</h2>
              </div>
              <p className="mt-1 text-sm font-medium text-muted-foreground italic">Review and manage the latest applications received for your job postings.</p>
            </div>
            <Link href="/employer/applications">
              <Button className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white text-[10px] font-black uppercase tracking-widest gap-2 transition-all shadow-lg shadow-blue-500/10">
                View All Applications
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                 <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Clock className="h-8 w-8 text-muted-foreground/30" />
                 </div>
                 <p className="text-lg font-bold text-muted-foreground italic tracking-tight">No applications received yet.</p>
              </div>
            ) : (
              recentApplications.map((app, idx) => (
                <div
                  key={app.id}
                  className="group flex flex-col md:flex-row items-center justify-between gap-8 p-10 transition-all hover:bg-white/[0.02] animate-in slide-in-from-right-10 duration-500 fill-mode-both"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex flex-col md:flex-row items-center gap-8 min-w-0 flex-1">
                    <CandidateAvatar
                      profileImage={app.jobSeeker.profileImage}
                      firstName={app.jobSeeker.firstName}
                      lastName={app.jobSeeker.lastName}
                      size="lg"
                      className="group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 text-center md:text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Applied For: {app.job.title}</p>
                      <h3 className="text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {app.jobSeeker.firstName} {app.jobSeeker.lastName}
                      </h3>
                      <div className="mt-3 flex flex-wrap justify-center md:justify-start items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {app.job.category}
                        </span>
                        {app.jobSeeker.user?.email && (
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                            {app.jobSeeker.user.email}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                          Applied: {new Date(app.appliedAt).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <span
                      className={`h-10 px-5 rounded-xl border flex items-center justify-center text-[10px] font-black uppercase tracking-widest ${
                        app.status === "SHORTLISTED"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : app.status === "REJECTED"
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      }`}
                    >
                      {app.status}
                    </span>
                    <div className="h-10 px-2 rounded-xl bg-white/5 border border-white/10 flex items-center">
                      <ApplicationActions
                        applicationId={app.id}
                        currentStatus={app.status}
                      />
                    </div>
                    {app.jobSeeker.resumeUrl && (
                      <a
                        href={app.jobSeeker.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/btn"
                      >
                        <Button className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white font-black uppercase tracking-widest transition-all gap-2 shadow-lg shadow-blue-500/10">
                          View Resume
                          <FileText className="h-3.5 w-3.5" />
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
