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
} from "lucide-react";
import { formatLocation } from "@/lib/utils";
import EmployerApprovalActions from "@/components/admin/EmployerApprovalActions";

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
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      {/* Tactical Hero Banner */}
      <div className="relative h-64 overflow-hidden rounded-b-[3rem] bg-white/[0.02] border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%232563eb%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
      </div>

      {/* Profile Node */}
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 -mt-32 relative z-10 sm:px-6 md:px-8 lg:px-10">
        <div className="linear-card group rounded-[3rem] bg-background/80 border border-white/10 p-10 shadow-2xl backdrop-blur-3xl">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-8">
              <Avatar className="h-28 w-28 shrink-0 rounded-3xl border-2 border-white/10 shadow-2xl transition-transform group-hover:scale-105 md:h-32 md:w-32">
                {isEmployer && user.employerProfile?.companyLogo ? (
                  <AvatarImage src={user.employerProfile.companyLogo} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-blue-500/10 text-3xl font-black text-blue-500 uppercase">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
                      {isEmployer ? "Employer Profile" : "User Profile"}
                   </p>
                </div>
                
                {isJobSeeker && user.jobSeekerProfile?.availabilityStatus && (
                  <span className="mb-4 inline-block rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                    STATUS: {user.jobSeekerProfile.availabilityStatus}
                  </span>
                )}
                
                {isEmployer && user.employerProfile?.approvalStatus && (
                  <span className={`mb-4 inline-block rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${
                    user.employerProfile.approvalStatus === "APPROVED"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : user.employerProfile.approvalStatus === "REJECTED"
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}>
                    APPROVAL: {user.employerProfile.approvalStatus}
                  </span>
                )}

                <h1 className="text-3xl font-black md:text-5xl tracking-tighter leading-tight mb-2 text-gradient">
                  {displayName}
                </h1>
                
                {tagline && (
                  <p className="text-lg font-medium text-muted-foreground italic mb-6">
                    {tagline}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 tabular-nums">
                  {isJobSeeker && (
                    <>
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {user.jobSeekerProfile?.location ? formatLocation(user.jobSeekerProfile.location) : "COORD_NULL"}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        EXP: {user.jobSeekerProfile?.experience != null ? `${user.jobSeekerProfile.experience}Y` : "N/A"}
                      </span>
                    </>
                  )}
                  {isEmployer && (
                    <>
                      <span className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                        SIZE: {user.employerProfile?.companySize || "UNKNOWN"}
                      </span>
                      <span className="flex items-center gap-2">
                         <Globe className="h-3.5 w-3.5 text-primary" />
                         INDUSTRY: {user.employerProfile?.industry || "UNSET"}
                      </span>
                    </>
                  )}
                </div>

                {isJobSeeker && user.jobSeekerProfile?.skills?.length ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {user.jobSeekerProfile.skills.map((s) => (
                      <span key={s} className="rounded-xl px-4 py-1.5 bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              {isEmployer && user.employerProfile && (
                <EmployerApprovalActions
                  userId={user.id}
                  approvalStatus={user.employerProfile.approvalStatus as any}
                  resumeSearchEnabled={user.employerProfile.resumeSearchEnabled}
                />
              )}
              <Link href="/admin/users">
                <Button variant="ghost" className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 transition-all">
                  ← Back to Users
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="mt-12 grid gap-10 lg:grid-cols-3 pb-20">
          <div className="lg:col-span-2 space-y-10">
            {/* Bio/Description Node */}
            {((isJobSeeker && user.jobSeekerProfile?.bio) || (isEmployer && user.employerProfile?.description)) && (
              <section className="linear-card rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                    {isJobSeeker ? "About" : "Company Description"}
                  </h2>
                </div>
                <p className="whitespace-pre-wrap text-muted-foreground font-medium italic leading-relaxed text-lg">
                  {isJobSeeker ? user.jobSeekerProfile?.bio : user.employerProfile?.description}
                </p>
              </section>
            )}

            {/* Education Node */}
            {isJobSeeker && user.jobSeekerProfile?.education && (
              <section className="linear-card rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 shadow-xl">
                 <div className="flex items-center gap-3 mb-8">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Education</h2>
                </div>
                <p className="text-muted-foreground font-medium italic leading-relaxed text-lg">{user.jobSeekerProfile.education}</p>
              </section>
            )}

            {/* Candidate Details Node */}
            {isJobSeeker && user.jobSeekerProfile && (
              <section className="linear-card rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 shadow-xl space-y-8">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Candidate Professional Details</h2>
                </div>
                
                <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
                  {user.jobSeekerProfile.highestEducation && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">Highest Education</p>
                      <p className="text-sm font-bold text-foreground">{user.jobSeekerProfile.highestEducation}</p>
                    </div>
                  )}
                  {user.jobSeekerProfile.noticePeriod && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">Notice Period / LWD</p>
                      <p className="text-sm font-bold text-foreground">{user.jobSeekerProfile.noticePeriod}</p>
                    </div>
                  )}
                  {user.jobSeekerProfile.dateOfBirth && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">Date of Birth</p>
                      <p className="text-sm font-bold text-foreground">
                        {new Date(user.jobSeekerProfile.dateOfBirth).toLocaleDateString(undefined, { dateStyle: "long" })}
                      </p>
                    </div>
                  )}
                  {user.jobSeekerProfile.linkedinUrl && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">LinkedIn Profile</p>
                      <a href={user.jobSeekerProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline break-all">
                        View LinkedIn
                      </a>
                    </div>
                  )}
                  {user.jobSeekerProfile.currentSalary !== null && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">Current Salary</p>
                      <p className="text-sm font-bold text-foreground">
                        {user.jobSeekerProfile.currentSalaryCurrency || "INR"} {user.jobSeekerProfile.currentSalary.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {user.jobSeekerProfile.expectedSalary !== null && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">Expected Salary</p>
                      <p className="text-sm font-bold text-foreground">
                        {user.jobSeekerProfile.expectedSalaryCurrency || "INR"} {user.jobSeekerProfile.expectedSalary.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {user.jobSeekerProfile.desiredLocation && (
                  <div className="pt-6 border-t border-white/5 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">Desired Location(s)</p>
                    <p className="text-sm font-bold text-foreground">
                      {formatLocation(user.jobSeekerProfile.desiredLocation)}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Certificates Node */}
            {isJobSeeker && user.jobSeekerProfile?.certificates && (() => {
              let list: { url: string; type: "image" | "pdf"; description: string }[];
              try {
                list = JSON.parse(user.jobSeekerProfile.certificates);
                if (!Array.isArray(list) || list.length === 0) return null;
              } catch {
                return null;
              }
              return (
                <section className="linear-card rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 shadow-xl">
                   <div className="flex items-center gap-3 mb-10">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Certificates</h2>
                  </div>
                  <div className="grid gap-4">
                    {list.map((cert, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.05]">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                               <Award className="h-6 w-6" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-foreground tracking-tight">{cert.description || "VERIFIED_ACC_0"+(idx+1)}</p>
                               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">Signed Certificate</p>
                            </div>
                         </div>
                         <Link href={cert.url} target="_blank" className="h-10 px-6 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-all flex items-center gap-2">
                            {cert.type === "image" ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                            Access File
                         </Link>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}
          </div>

          {/* Account Snapshot Sidebar */}
          <div className="space-y-10">
            <section className="linear-card rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 shadow-xl">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-foreground">Contact Information</h2>
              </div>
              
              <div className="space-y-10">
                 <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-primary/40 shrink-0">
                       <Mail className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">Email Address</p>
                        <p className="text-sm font-black text-foreground tracking-tight break-all">{user.email}</p>
                    </div>
                 </div>
                 
                 {isJobSeeker && user.jobSeekerProfile?.phone && (
                   <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary/40 shrink-0">
                         <Phone className="h-5 w-5" />
                      </div>
                      <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">Phone Number</p>
                          <p className="text-sm font-black text-foreground tracking-tight tabular-nums">{user.jobSeekerProfile.phone}</p>
                      </div>
                   </div>
                 )}

                 {isEmployer && user.employerProfile?.website && (
                   <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-primary/40 shrink-0">
                         <Globe className="h-5 w-5" />
                      </div>
                      <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">Website</p>
                          <a
                            href={user.employerProfile.website.startsWith("http") ? user.employerProfile.website : `https://${user.employerProfile.website}`}
                            target="_blank"
                            className="text-sm font-black text-primary hover:text-blue-400 transition-colors tracking-tight"
                          >
                            {user.employerProfile.website}
                          </a>
                      </div>
                   </div>
                 )}

                 {isEmployer && user.employerProfile?.pointOfContact && (
                   <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary/40 shrink-0">
                         <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">Point of Contact</p>
                          <p className="text-sm font-black text-foreground tracking-tight">{user.employerProfile.pointOfContact}</p>
                      </div>
                   </div>
                 )}

                 {isEmployer && user.employerProfile?.phone && (
                   <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary/40 shrink-0">
                         <Phone className="h-5 w-5" />
                      </div>
                      <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">Phone Number</p>
                          <p className="text-sm font-black text-foreground tracking-tight tabular-nums">{user.employerProfile.phone}</p>
                      </div>
                   </div>
                 )}

                 <div className="pt-10 border-t border-white/5 grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">Role</p>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-widest">{user.role.replace("_", " ")}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">Auth Status</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${user.emailVerified ? "text-emerald-400" : "text-amber-400"}`}>
                           {user.emailVerified ? "VERIFIED" : "UNVERIFIED"}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1 italic">Joined Date</p>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-widest tabular-nums">
                           {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                 </div>
              </div>
            </section>

            {/* MSME / Authority Registration Document — Employer only */}
            {isEmployer && user.employerProfile?.msmeDocUrl && (
              <section className="linear-card rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-foreground">Registration Document</h2>
                </div>
                <a
                  href={user.employerProfile.msmeDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-amber-500/5 hover:border-amber-500/20 transition-all group"
                >
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-foreground group-hover:text-amber-400 transition-colors">MSME / Authority Registration</p>
                    <p className="text-[10px] font-semibold text-muted-foreground/40 italic mt-0.5">Click to view document</p>
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
