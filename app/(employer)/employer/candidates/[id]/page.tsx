import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CandidateBackButton from "@/components/employer/CandidateBackButton";
import { formatLocation, formatResumeUpdatedAt } from "@/lib/utils";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  User,
  FileText,
  ArrowLeft,
  ImageIcon,
  Award,
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
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      {/* Hero section */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white py-12">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 pointer-events-none" />
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 md:px-8 lg:px-10 pb-6">
          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
              <div className="group relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition-transform hover:scale-105">
                {candidate.profileImage ? (
                  <img
                    src={candidate.profileImage}
                    alt={`${candidate.firstName} ${candidate.lastName}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  <span className="text-4xl font-black text-blue-600">{initials}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Profile Verified
                  </span>
                  {candidate.availabilityStatus && (
                    <span className="rounded-full bg-emerald-55 border border-emerald-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                      {candidate.availabilityStatus}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl font-black text-slate-900 md:text-5xl tracking-tight leading-none">
                  {candidate.firstName} {candidate.lastName}
                </h1>

                {candidate.jobTitle && (
                  <p className="mt-3 flex items-center justify-center sm:justify-start gap-2.5 text-base font-bold text-blue-600">
                    <Briefcase className="h-4.5 w-4.5 text-blue-500" />
                    {candidate.jobTitle}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap justify-center sm:justify-start gap-3">
                  {candidate.experience != null && (
                    <span className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 shadow-sm">
                      {candidate.experience} Years Experience
                    </span>
                  )}
                  {candidate.location && (
                    <span className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 shadow-sm">
                      <MapPin className="h-3.5 w-3.5 mr-2 inline text-blue-500" />
                      {formatLocation(candidate.location)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Back Button on Right Side */}
            <div className="shrink-0">
              <CandidateBackButton fallbackUrl="/employer/search" label="Back to Search" />
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 mt-8 pb-24 sm:px-6 md:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Intelligence Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm">
              {/* Contact Grid */}
              <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Email Address</p>
                  <a href={`mailto:${candidate.user.email}`} title={candidate.user.email} className="text-sm font-normal text-primary hover:text-blue-400 transition-colors block truncate max-w-full">
                    {candidate.user.email}
                  </a>
                </div>
                {candidate.phone && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Phone Number</p>
                    <a href={`tel:${candidate.phone}`} className="text-sm font-normal text-foreground hover:text-primary transition-colors">
                      {candidate.phone}
                    </a>
                  </div>
                )}
                {candidate.location && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Location (Current)</p>
                    <p className="text-sm font-normal text-foreground">
                      {formatLocation(candidate.location)}
                    </p>
                  </div>
                )}
              </div>

              {/* Professional Details */}
              <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-8 border-t border-slate-200/60">
                {candidate.highestEducation && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Highest Education</p>
                    <p className="text-sm font-normal text-foreground">{candidate.highestEducation}</p>
                  </div>
                )}
                {candidate.noticePeriod && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Notice Period / LWD</p>
                    <p className="text-sm font-normal text-foreground">{candidate.noticePeriod}</p>
                  </div>
                )}
                {candidate.dateOfBirth && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Date of Birth</p>
                    <p className="text-sm font-normal text-foreground">
                      {new Date(candidate.dateOfBirth).toLocaleDateString(undefined, { dateStyle: "long" })}
                    </p>
                  </div>
                )}
                {candidate.linkedinUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">LinkedIn</p>
                    <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-primary hover:text-blue-400 transition-colors break-all">
                      View Profile
                    </a>
                  </div>
                )}
                {candidate.currentSalary !== null && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Current Salary</p>
                    <p className="text-sm font-normal text-foreground">
                      {candidate.currentSalaryCurrency || "INR"} {candidate.currentSalary.toLocaleString()}
                    </p>
                  </div>
                )}
                {candidate.expectedSalary !== null && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Expected Salary</p>
                    <p className="text-sm font-normal text-foreground">
                      {candidate.expectedSalaryCurrency || "INR"} {candidate.expectedSalary.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {candidate.desiredLocation && (
                <div className="mb-16 pt-8 border-t border-slate-200/60 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Desired Location(s)</p>
                  <p className="text-sm font-normal text-foreground">
                    {formatLocation(candidate.desiredLocation)}
                  </p>
                </div>
              )}

              {/* Bio / About */}
              {candidate.bio && (
                <div className="mb-16">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Cover Letter</h3>
                  </div>
                  <div className="rounded-[2rem] bg-slate-50 border border-slate-200 p-8 sm:p-10 shadow-sm">
                    <p className="whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground font-medium italic">
                      &quot;{candidate.bio}&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* Skills Matrix */}
              {candidate.skills.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {candidate.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-black uppercase tracking-widest text-emerald-400 shadow-xl shadow-emerald-500/5 transition-transform hover:scale-105"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {candidate.education && (
                <div className="mb-16">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Education</h3>
                  </div>
                  <div className="rounded-[2rem] bg-slate-50 border border-slate-200 p-8 shadow-sm">
                    <p className="text-lg font-bold text-foreground/90 leading-relaxed italic">
                      {candidate.education}
                    </p>
                  </div>
                </div>
              )}

              {/* Certification Grid */}
              {(() => {
                if (!candidate.certificates) return null;
                let list: { url: string; type: "image" | "pdf"; description: string }[];
                try {
                  list = JSON.parse(candidate.certificates);
                  if (!Array.isArray(list) || list.length === 0) return null;
                } catch {
                  return null;
                }
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">External Links</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {list.map((cert, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-200 transition-all hover:bg-slate-100 shadow-sm">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 truncate">
                              {cert.description || "Unspecified Credential"}
                            </p>
                            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                              {cert.type === "image" ? "Verified Image" : "PDF Document"}
                            </p>
                          </div>
                          <a
                            href={cert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-foreground hover:bg-slate-200 transition-all hover:scale-110 shadow-sm"
                          >
                            {cert.type === "image" ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Column: Tactical Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Resume Card */}
            {candidate.resumeUrl && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600">Resume</h3>
                </div>

                <p className="text-sm font-medium text-muted-foreground leading-loose italic mb-8">
                  The candidate&apos;s full resume is available for review.
                </p>

                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-3 h-12 rounded-xl bg-emerald-600 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:scale-105 active:scale-95 hover:bg-emerald-500"
                >
                  <FileText className="h-5 w-5" />
                  View Full Resume
                </a>

                {candidate.resumeUpdatedAt && (
                  <p className="mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-center">
                    Last Updated: {formatResumeUpdatedAt(candidate.resumeUpdatedAt)}
                  </p>
                )}
              </div>
            )}

            {/* Profile Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600 mb-5">Profile Summary</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center py-4 border-b border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Registered</span>
                  <span className="text-xs font-bold text-foreground">{new Date(candidate.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Verification</span>
                  <span className="text-xs font-bold text-emerald-600">PASSED</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status</span>
                  <span className="text-xs font-bold text-primary">ACTIVE</span>
                </div>
              </div>
              <p className="mt-5 text-[10px] font-semibold text-slate-400 leading-relaxed">
                Application received. Profile and information submitted securely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
