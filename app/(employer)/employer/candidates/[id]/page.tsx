import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatLocation } from "@/lib/utils";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  User,
  FileText,
  ArrowLeft,
} from "lucide-react";

export default async function EmployerCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEmployer();
  const { id } = await params;

  const candidate = await prisma.jobSeekerProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!candidate) {
    notFound();
  }

  const initials = `${candidate.firstName?.[0] ?? ""}${candidate.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-b-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 pb-24 pt-6 md:px-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.06%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
        <Link href="/employer/search">
          <Button
            variant="secondary"
            size="sm"
            className="mb-6 gap-2 bg-white/10 text-white hover:bg-white/20 border-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Button>
        </Link>
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-end">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/30 bg-white/20 shadow-lg backdrop-blur-sm">
            {candidate.profileImage ? (
              <img
                src={candidate.profileImage}
                alt={`${candidate.firstName} ${candidate.lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-white">{initials}</span>
            )}
          </div>
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {candidate.firstName} {candidate.lastName}
            </h1>
            {candidate.jobTitle && (
              <p className="mt-1 flex items-center gap-2 text-blue-100">
                <Briefcase className="h-4 w-4" />
                {candidate.jobTitle}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {candidate.availabilityStatus && (
                <span className="rounded-full bg-emerald-400/30 px-3 py-1 text-xs font-medium text-white">
                  {candidate.availabilityStatus}
                </span>
              )}
              {candidate.experience != null && (
                <span className="rounded-full bg-amber-400/30 px-3 py-1 text-xs font-medium text-white">
                  {candidate.experience} years experience
                </span>
              )}
              {candidate.location && (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  {formatLocation(candidate.location)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content card */}
      <div className="container mx-auto px-4 -mt-16 pb-12">
        <Card className="overflow-hidden rounded-2xl border-gray-200 bg-white shadow-lg">
          <CardContent className="p-6 md:p-8">
            {/* Contact info */}
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-blue-50/50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Email</p>
                  <a
                    href={`mailto:${candidate.user.email}`}
                    className="mt-1 block font-medium text-[#2563eb] hover:underline"
                  >
                    {candidate.user.email}
                  </a>
                </div>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-emerald-50/50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</p>
                    <a
                      href={`tel:${candidate.phone}`}
                      className="mt-1 block font-medium text-emerald-700 hover:underline"
                    >
                      {candidate.phone}
                    </a>
                  </div>
                </div>
              )}
              {candidate.location && (
                <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-violet-50/50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Location</p>
                    <p className="mt-1 font-medium text-gray-900">{formatLocation(candidate.location)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Skills */}
            {candidate.skills.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  <Briefcase className="h-4 w-4 text-[#2563eb]" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-[#2563eb]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {candidate.education && (
              <div className="mb-8">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  <GraduationCap className="h-4 w-4 text-violet-600" />
                  Education
                </h3>
                <p className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-gray-700">
                  {candidate.education}
                </p>
              </div>
            )}

            {/* About */}
            {candidate.bio && (
              <div className="mb-8">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  <User className="h-4 w-4 text-amber-600" />
                  About
                </h3>
                <p className="whitespace-pre-wrap rounded-xl border border-gray-100 bg-amber-50/30 p-4 text-gray-700">
                  {candidate.bio}
                </p>
              </div>
            )}

            {/* Resume */}
            {candidate.resumeUrl && (
              <div className="mb-8">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Resume
                </h3>
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-6 py-3 font-medium text-emerald-700 transition-colors hover:bg-emerald-100 hover:border-emerald-300"
                >
                  <FileText className="h-5 w-5" />
                  View / Download Resume
                </a>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 text-sm text-gray-500">
              Profile updated {new Date(candidate.updatedAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
