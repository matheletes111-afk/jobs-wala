import { redirect } from "next/navigation";
import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatLocation } from "@/lib/utils";
import CompanyLogo from "@/components/CompanyLogo";
import { Briefcase, FileText, User, ChevronRight, Plus } from "lucide-react";

export default async function UserDashboardPage() {
  const user = await requireJobSeeker();

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: user.id },
  });

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

  if (!profile) {
    redirect("/user/profile/create");
  }

  const colorCards = [
    {
      label: "Profile Status",
      value: profile.resumeUrl ? "Complete" : "Incomplete",
      icon: User,
      href: "/user/profile",
      className: profile.resumeUrl
        ? "bg-emerald-600 text-white hover:bg-emerald-700"
        : "bg-amber-500 text-white hover:bg-amber-600",
    },
    {
      label: "Applications",
      value: applicationsCount,
      icon: FileText,
      href: "/user/applications",
      className: "bg-blue-600 text-white hover:bg-blue-700",
    },
    {
      label: "Browse Jobs",
      value: "Find Jobs",
      icon: Briefcase,
      href: "/user/jobs",
      className: "bg-violet-600 text-white hover:bg-violet-700",
    },
  ];

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50/50">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Welcome to Your Dashboard
            </h1>
            <p className="mt-1 text-gray-600">
              Track your applications and discover new opportunities.
            </p>
          </div>
          <Link href="/user/jobs">
            <Button className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8]">
              <Plus className="h-4 w-4" />
              Browse Jobs
            </Button>
          </Link>
        </div>

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

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
              <p className="text-sm text-gray-500">Your latest job applications</p>
            </div>
            <Link href="/user/applications">
              <Button variant="outline" size="sm" className="gap-1">
                View all
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentApplications.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No applications yet. Start applying to jobs!
              </div>
            ) : (
              recentApplications.map((application: {
                id: string;
                status: string;
                appliedAt: Date;
                job: {
                  title: string;
                  location: string | null;
                  category: string;
                  employer: {
                    companyName: string;
                    companyLogo?: string | null;
                  };
                };
              }) => (
                <Link
                  key={application.id}
                  href="/user/applications"
                  className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <CompanyLogo
                    companyLogo={application.job.employer.companyLogo}
                    companyName={application.job.employer.companyName}
                    size="sm"
                    className="shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">{application.job.title}</h3>
                    <p className="text-sm text-gray-500">
                      {application.job.employer.companyName}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {formatLocation(application.job.location)}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {application.job.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Applied {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      application.status === "SHORTLISTED"
                        ? "bg-emerald-100 text-emerald-800"
                        : application.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {application.status}
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

