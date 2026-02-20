import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { formatLocation } from "@/lib/utils";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      jobSeekerProfile: true,
      employerProfile: true,
    },
  });

  if (!user) notFound();

  const isEmployer = user.role === "EMPLOYER";
  const isJobSeeker = user.role === "JOB_SEEKER";
  const profile = isJobSeeker ? user.jobSeekerProfile : user.employerProfile;

  const displayName = isJobSeeker && user.jobSeekerProfile
    ? `${user.jobSeekerProfile.firstName} ${user.jobSeekerProfile.lastName}`
    : isEmployer && user.employerProfile
      ? user.employerProfile.companyName
      : user.email;

  const tagline = isJobSeeker && user.jobSeekerProfile?.jobTitle
    ? user.jobSeekerProfile.jobTitle
    : isEmployer && user.employerProfile?.industry
      ? user.employerProfile.industry
      : null;

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
              <Avatar className="h-24 w-24 shrink-0 md:h-28 md:w-28">
                {isEmployer && user.employerProfile?.companyLogo ? (
                  <AvatarImage
                    src={user.employerProfile.companyLogo}
                    alt={displayName}
                  />
                ) : null}
                <AvatarFallback className="bg-[#2563eb]/10 text-2xl font-semibold text-[#2563eb]">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                {isJobSeeker && user.jobSeekerProfile?.availabilityStatus && (
                  <span className="mb-2 inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    {user.jobSeekerProfile.availabilityStatus}
                  </span>
                )}
                {tagline && (
                  <p className="text-sm text-gray-500">{tagline}</p>
                )}
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                  {displayName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {isJobSeeker && user.jobSeekerProfile && (
                    <>
                      {user.jobSeekerProfile.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {formatLocation(user.jobSeekerProfile.location)}
                        </span>
                      )}
                      {user.jobSeekerProfile.experience != null && (
                        <span>{user.jobSeekerProfile.experience} yrs experience</span>
                      )}
                    </>
                  )}
                  {isEmployer && user.employerProfile && (
                    <>
                      {user.employerProfile.companySize && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {user.employerProfile.companySize}
                        </span>
                      )}
                      {user.employerProfile.industry && (
                        <span>{user.employerProfile.industry}</span>
                      )}
                    </>
                  )}
                </div>
                {isJobSeeker && user.jobSeekerProfile?.skills?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {user.jobSeekerProfile.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#2563eb]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href="/admin/users">
                <Button variant="outline" className="border-[#2563eb] text-[#2563eb] hover:bg-blue-50">
                  ← Back to Users
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Two-column content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {(isJobSeeker && user.jobSeekerProfile?.bio) ||
            (isEmployer && user.employerProfile?.description) ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  {isJobSeeker ? "About" : "Who We Are"}
                </h2>
                <p className="whitespace-pre-wrap text-gray-600">
                  {isJobSeeker
                    ? user.jobSeekerProfile?.bio
                    : user.employerProfile?.description}
                </p>
              </section>
            ) : null}

            {isJobSeeker && user.jobSeekerProfile?.education && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-gray-900">Education</h2>
                <p className="text-gray-600">{user.jobSeekerProfile.education}</p>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Account Snapshot
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Email</span>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </li>
                {isJobSeeker && user.jobSeekerProfile?.phone && (
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Phone</span>
                      <p className="font-medium text-gray-900">
                        {user.jobSeekerProfile.phone}
                      </p>
                    </div>
                  </li>
                )}
                {isEmployer && user.employerProfile?.website && (
                  <li className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Website</span>
                      <a
                        href={
                          user.employerProfile.website.startsWith("http")
                            ? user.employerProfile.website
                            : `https://${user.employerProfile.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#2563eb] hover:underline"
                      >
                        {user.employerProfile.website}
                      </a>
                    </div>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Role</span>
                    <p className="font-medium text-gray-900">
                      {user.role.replace("_", " ")}
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Verified</span>
                    <p className="font-medium text-gray-900">
                      {user.emailVerified ? "Yes" : "No"}
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Joined</span>
                    <p className="font-medium text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
