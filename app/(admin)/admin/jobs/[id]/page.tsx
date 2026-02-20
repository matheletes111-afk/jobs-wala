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
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="relative h-48 overflow-hidden rounded-b-2xl bg-gradient-to-br from-slate-200 to-slate-300 md:h-56">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.08%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
      </div>

      {/* Overlay card */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-6">
              <CompanyLogo
                companyLogo={job.employer.companyLogo}
                companyName={job.employer.companyName}
                size="lg"
                className="h-20 w-20 rounded-xl"
              />
              <div>
                <p className="text-sm text-gray-500">{job.employer.industry || job.category}</p>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                  {job.title}
                </h1>
                <p className="mt-1 text-gray-600">{job.employer.companyName}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {formatLocation(job.location)}
                  </span>
                  {job.employer.companySize && (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.employer.companySize}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      job.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : job.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {statusLabel}
                  </span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#2563eb]">
                    {job.employmentType.replace("_", " ")}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {job._count.applications} applications
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link href="/admin/jobs">
                <Button
                  variant="outline"
                  className="border-[#2563eb] text-[#2563eb] hover:bg-blue-50"
                >
                  ← Back to Jobs
                </Button>
              </Link>
              <JobApprovalActions
                jobId={job.id}
                currentStatus={job.status}
              />
            </div>
          </div>
        </div>

        {/* Two-column content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Job Description
              </h2>
              <p className="whitespace-pre-wrap text-gray-600">
                {job.description}
              </p>
            </section>

            {skills.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Skills & Requirements
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#2563eb]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {job.applications.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Applicants ({job.applications.length})
                </h2>
                <div className="space-y-4">
                  {job.applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <CandidateAvatar
                            profileImage={app.jobSeeker.profileImage}
                            firstName={app.jobSeeker.firstName}
                            lastName={app.jobSeeker.lastName}
                            size="sm"
                            className="rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {app.jobSeeker.firstName} {app.jobSeeker.lastName}
                            </p>
                            <p className="flex items-center gap-1 text-sm text-gray-500">
                              <Mail className="h-3.5 w-3.5" />
                              {app.jobSeeker.user.email}
                            </p>
                          </div>
                        </div>
                        {app.jobSeeker.jobTitle && (
                          <p className="mt-2 text-sm text-gray-600">
                            {app.jobSeeker.jobTitle}
                            {app.jobSeeker.experience != null &&
                              ` · ${app.jobSeeker.experience} yrs exp`}
                          </p>
                        )}
                        {app.coverLetter && (
                          <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                            <p className="line-clamp-2">{app.coverLetter}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            app.status === "SHORTLISTED"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : app.status === "REVIEWED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {app.status}
                        </span>
                        <Link href={`/admin/users/${app.jobSeeker.userId}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <UserCircle className="h-3.5 w-3.5" />
                            View profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {job.employer.description && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  About {job.employer.companyName}
                </h2>
                <p className="text-gray-600">{job.employer.description}</p>
                {job.employer.website && (
                  <a
                    href={
                      job.employer.website.startsWith("http")
                        ? job.employer.website
                        : `https://${job.employer.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[#2563eb] hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Visit website
                  </a>
                )}
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Job Snapshot
              </h2>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Company</span>
                    <p className="font-medium text-gray-900">
                      {job.employer.companyName}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Category</span>
                    <p className="font-medium text-gray-900">{job.category}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Location</span>
                    <p className="font-medium text-gray-900">
                      {formatLocation(job.location)}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Experience</span>
                    <p className="font-medium text-gray-900">{experienceStr}</p>
                  </div>
                </li>
                {salaryStr && (
                  <li className="flex items-start gap-3">
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Salary</span>
                      <p className="font-medium text-gray-900">{salaryStr}</p>
                    </div>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Posted</span>
                    <p className="font-medium text-gray-900">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
                {job.expiresAt && (
                  <li className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Expires</span>
                      <p className="font-medium text-gray-900">
                        {new Date(job.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                )}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
