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
  FileText,
  ImageIcon,
  Award,
  ArrowLeft,
} from "lucide-react";
import { formatLocation } from "@/lib/utils";
import EmployerApprovalActions from "@/components/admin/EmployerApprovalActions";

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sParams = await searchParams;
  const searchVal = typeof sParams.search === "string" ? sParams.search : "";
  const roleVal = typeof sParams.role === "string" ? sParams.role : "";

  const backParams = new URLSearchParams();
  if (searchVal) backParams.set("search", searchVal);
  if (roleVal && roleVal !== "all") backParams.set("role", roleVal);
  if (typeof sParams.page === "string" && sParams.page !== "1") backParams.set("page", sParams.page);
  const backQuery = backParams.toString();
  const fromPath = typeof sParams.from === "string" && sParams.from.startsWith("/") ? sParams.from : "/admin/users";
  const backUrl = `${fromPath}${backQuery ? `?${backQuery}` : ""}`;

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
    <div className="min-h-screen w-full min-w-0 bg-slate-50 text-slate-800 animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">

        {/* Back Navigation */}
        <div className="mb-6">
          <Link href={backUrl}>
            <Button variant="ghost" className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all group gap-2">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Users
            </Button>
          </Link>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8 animate-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200 shadow-sm">
                {isEmployer && user.employerProfile?.companyLogo ? (
                  <AvatarImage src={user.employerProfile.companyLogo} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-blue-50 text-2xl font-bold text-blue-600 uppercase rounded-2xl">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">
                  {isEmployer ? "Employer Profile" : "User Profile"}
                </p>

                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{displayName}</h1>

                {tagline && (
                  <p className="text-sm font-medium text-slate-500 mb-3">{tagline}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {isJobSeeker && user.jobSeekerProfile?.availabilityStatus && (
                    <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      {user.jobSeekerProfile.availabilityStatus}
                    </span>
                  )}
                  {isEmployer && user.employerProfile?.approvalStatus && (
                    <span className={`inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      user.employerProfile.approvalStatus === "APPROVED"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : user.employerProfile.approvalStatus === "REJECTED"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}>
                      {user.employerProfile.approvalStatus}
                    </span>
                  )}
                  {isJobSeeker && (
                    <>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {user.jobSeekerProfile?.location ? formatLocation(user.jobSeekerProfile.location) : "Not set"}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {user.jobSeekerProfile?.experience != null ? `${user.jobSeekerProfile.experience} yrs exp` : "N/A"}
                      </span>
                    </>
                  )}
                  {isEmployer && (
                    <>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                        {user.employerProfile?.companySize || "Size unknown"}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        {user.employerProfile?.industry || "Industry unset"}
                      </span>
                    </>
                  )}
                </div>

                {isJobSeeker && user.jobSeekerProfile?.skills?.length ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {user.jobSeekerProfile.skills.map((s) => (
                      <span key={s} className="rounded-full px-3 py-1 bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {isEmployer && user.employerProfile && (
                <EmployerApprovalActions
                  userId={user.id}
                  approvalStatus={user.employerProfile.approvalStatus as any}
                  resumeSearchEnabled={user.employerProfile.resumeSearchEnabled}
                  resumeUploadEnabled={user.employerProfile.resumeUploadEnabled}
                />
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3 pb-12">
          <div className="lg:col-span-2 space-y-6">

            {/* Bio / Description */}
            {((isJobSeeker && user.jobSeekerProfile?.bio) || (isEmployer && user.employerProfile?.description)) && (
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                  {isJobSeeker ? "About" : "Company Description"}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {isJobSeeker ? user.jobSeekerProfile?.bio : user.employerProfile?.description}
                </p>
              </section>
            )}

            {/* Education */}
            {isJobSeeker && user.jobSeekerProfile?.education && (
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Education</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{user.jobSeekerProfile.education}</p>
              </section>
            )}

            {/* Candidate Professional Details */}
            {isJobSeeker && user.jobSeekerProfile && (
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Candidate Professional Details</h2>
                <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                  {user.jobSeekerProfile.highestEducation && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Highest Education</p>
                      <p className="text-sm font-semibold text-slate-800">{user.jobSeekerProfile.highestEducation}</p>
                    </div>
                  )}
                  {user.jobSeekerProfile.noticePeriod && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notice Period / LWD</p>
                      <p className="text-sm font-semibold text-slate-800">{user.jobSeekerProfile.noticePeriod}</p>
                    </div>
                  )}
                  {user.jobSeekerProfile.dateOfBirth && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date of Birth</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {new Date(user.jobSeekerProfile.dateOfBirth).toLocaleDateString(undefined, { dateStyle: "long" })}
                      </p>
                    </div>
                  )}
                  {user.jobSeekerProfile.linkedinUrl && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">LinkedIn Profile</p>
                      <a href={user.jobSeekerProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline break-all">
                        View LinkedIn
                      </a>
                    </div>
                  )}
                  {user.jobSeekerProfile.currentSalary !== null && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Salary</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {user.jobSeekerProfile.currentSalaryCurrency || "INR"} {user.jobSeekerProfile.currentSalary.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {user.jobSeekerProfile.expectedSalary !== null && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expected Salary</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {user.jobSeekerProfile.expectedSalaryCurrency || "INR"} {user.jobSeekerProfile.expectedSalary.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                {user.jobSeekerProfile.desiredLocation && (
                  <div className="pt-4 border-t border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Desired Location(s)</p>
                    <p className="text-sm font-semibold text-slate-800">{formatLocation(user.jobSeekerProfile.desiredLocation)}</p>
                  </div>
                )}
              </section>
            )}

            {/* Certificates */}
            {isJobSeeker && user.jobSeekerProfile?.certificates && (() => {
              let list: { url: string; type: "image" | "pdf"; description: string }[];
              try {
                list = JSON.parse(user.jobSeekerProfile.certificates);
                if (!Array.isArray(list) || list.length === 0) return null;
              } catch {
                return null;
              }
              return (
                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-5">Certificates</h2>
                  <div className="grid gap-3">
                    {list.map((cert, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                            <Award className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{cert.description || `Certificate ${idx + 1}`}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Signed Certificate</p>
                          </div>
                        </div>
                        <a href={cert.url} target="_blank" className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                          {cert.type === "image" ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-5">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Email Address</p>
                    <p className="text-sm font-semibold text-slate-800 break-all">{user.email}</p>
                  </div>
                </div>

                {isJobSeeker && user.jobSeekerProfile?.phone && (
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Phone Number</p>
                      <p className="text-sm font-semibold text-slate-800">{user.jobSeekerProfile.phone}</p>
                    </div>
                  </div>
                )}

                {isEmployer && user.employerProfile?.website && (
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Website</p>
                      <a
                        href={user.employerProfile.website.startsWith("http") ? user.employerProfile.website : `https://${user.employerProfile.website}`}
                        target="_blank"
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {user.employerProfile.website}
                      </a>
                    </div>
                  </div>
                )}

                {isEmployer && user.employerProfile?.pointOfContact && (
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Point of Contact</p>
                      <p className="text-sm font-semibold text-slate-800">{user.employerProfile.pointOfContact}</p>
                    </div>
                  </div>
                )}

                {isEmployer && user.employerProfile?.phone && (
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Phone Number</p>
                      <p className="text-sm font-semibold text-slate-800">{user.employerProfile.phone}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Role</p>
                    <p className="text-xs font-bold text-slate-800 uppercase">{user.role.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Auth Status</p>
                    <p className={`text-xs font-bold uppercase ${user.emailVerified ? "text-emerald-600" : "text-amber-600"}`}>
                      {user.emailVerified ? "Verified" : "Unverified"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Joined Date</p>
                    <p className="text-xs font-bold text-slate-800">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* MSME Document */}
            {isEmployer && user.employerProfile?.msmeDocUrl && (
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Registration Document</h2>
                <a
                  href={user.employerProfile.msmeDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all group"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">MSME / Authority Registration</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Click to view document</p>
                  </div>
                </a>
              </section>
            )}

            {/* Resume / CV */}
            {isJobSeeker && user.jobSeekerProfile?.resumeUrl && (
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Resume / CV</h2>
                <a
                  href={user.jobSeekerProfile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-all group"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">Download CV</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Click to view/download resume</p>
                  </div>
                </a>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
