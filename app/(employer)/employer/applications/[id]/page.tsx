import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ApplicationActions from "@/components/employer/ApplicationActions";
import SkillMatchBar from "@/components/employer/SkillMatchBar";
import CandidateAvatar from "@/components/CandidateAvatar";
import { computeSkillMatch, skillKeywordMatch } from "@/lib/skill-match";
import { formatLocation } from "@/lib/utils";
import { FileText, MapPin, Briefcase, GraduationCap, Phone, Mail, Calendar, ArrowLeft, BadgeDollarSign } from "lucide-react";

export default async function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireEmployer();
  const { id } = await params;

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-md mx-auto shadow-sm">
          <p className="text-lg font-semibold text-slate-600 mb-6">Identity Verification Required</p>
          <Link href="/employer/profile">
            <button className="h-11 px-7 rounded-xl bg-primary text-white font-semibold text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
              Complete Corporate Profile
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      job: true,
      jobSeeker: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!application || application.job.postedBy !== profile.userId) {
    notFound();
  }

  const skillMatch = computeSkillMatch(
    [...(application.job.requiredSkills ?? []), ...(application.job.secondarySkills ?? [])],
    application.jobSeeker.skills ?? [],
    application.jobSeeker.bio
  );

  const formatEmploymentType = (type: string) => {
    return type.replace("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null, payType: string | null) => {
    if (min === null && max === null) return "Not specified";
    const cur = currency || "INR";
    const pType = payType ? ` / ${payType.toLowerCase()}` : "";
    if (min !== null && max !== null) {
      return `${cur} ${min.toLocaleString()} - ${max.toLocaleString()}${pType}`;
    }
    if (min !== null) {
      return `From ${cur} ${min.toLocaleString()}${pType}`;
    }
    if (max !== null) {
      return `Up to ${cur} ${max.toLocaleString()}${pType}`;
    }
    return "Not specified";
  };

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10">
        
        {/* Back navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/employer/applications"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-95 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Applications
          </Link>
          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            Application ID: {application.id}
          </span>
        </div>

        {/* Core Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Left / Center 2 Columns: Candidate & Profile Information */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Candidate Header Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <CandidateAvatar
                profileImage={application.jobSeeker.profileImage}
                firstName={application.jobSeeker.firstName}
                lastName={application.jobSeeker.lastName}
                size="lg"
                className="h-24 w-24 border-2 border-slate-200 shadow-lg"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Candidate Profile</p>
                <h1 className="text-3xl font-black text-foreground tracking-tight">
                  {application.jobSeeker.firstName} {application.jobSeeker.lastName}
                </h1>
                {application.jobSeeker.jobTitle && (
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{application.jobSeeker.jobTitle}</p>
                )}
                
                <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                  {application.jobSeeker.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary" />
                      {application.jobSeeker.location}
                    </span>
                  )}
                  {application.jobSeeker.experience !== null && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-primary" />
                      {application.jobSeeker.experience} Years Experience
                    </span>
                  )}
                  {application.jobSeeker.education && (
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      {application.jobSeeker.education}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Candidate Contact & Biography */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-black uppercase tracking-widest text-foreground pb-4 border-b border-slate-200">Contact Information</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email Address</p>
                    <p className="text-sm font-bold text-slate-700">{application.jobSeeker.user.email}</p>
                  </div>
                </div>
                {application.jobSeeker.phone && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Phone Number</p>
                      <p className="text-sm font-bold text-slate-700">{application.jobSeeker.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {application.jobSeeker.bio && (
                <div className="pt-6 border-t border-slate-200/60">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Biography / Professional Summary</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {application.jobSeeker.bio}
                  </p>
                </div>
              )}

              {/* Professional Candidate Details */}
              <div className="pt-6 border-t border-slate-200/60 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Candidate Details</h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {application.jobSeeker.highestEducation && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Highest Education</p>
                      <p className="text-sm font-bold text-slate-700">{application.jobSeeker.highestEducation}</p>
                    </div>
                  )}
                  {application.jobSeeker.noticePeriod && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Notice Period / LWD</p>
                      <p className="text-sm font-bold text-slate-700">{application.jobSeeker.noticePeriod}</p>
                    </div>
                  )}
                  {application.jobSeeker.dateOfBirth && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date of Birth</p>
                      <p className="text-sm font-bold text-slate-700">
                        {new Date(application.jobSeeker.dateOfBirth).toLocaleDateString(undefined, { dateStyle: "long" })}
                      </p>
                    </div>
                  )}
                  {application.jobSeeker.linkedinUrl && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">LinkedIn URL</p>
                      <a href={application.jobSeeker.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline break-all">
                        View Profile
                      </a>
                    </div>
                  )}
                  {application.jobSeeker.currentSalary !== null && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current Salary</p>
                      <p className="text-sm font-bold text-slate-700">
                        {application.jobSeeker.currentSalaryCurrency || "INR"} {application.jobSeeker.currentSalary.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {application.jobSeeker.expectedSalary !== null && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Expected Salary</p>
                      <p className="text-sm font-bold text-slate-700">
                        {application.jobSeeker.expectedSalaryCurrency || "INR"} {application.jobSeeker.expectedSalary.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                
                {application.jobSeeker.desiredLocation && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Desired Location(s)</p>
                    <p className="text-sm font-bold text-slate-700">{formatLocation(application.jobSeeker.desiredLocation)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Letter details */}
            {application.coverLetter && (
              <div className="bg-blue-50 border border-blue-200 border-l-4 border-l-primary rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Cover Letter Submitted</p>
                <div className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap italic">
                  &quot;{application.coverLetter}&quot;
                </div>
              </div>
            )}

            {/* Candidate Resume Section */}
            {application.jobSeeker.resumeUrl && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Attached Resume</h3>
                    <p className="text-xs font-semibold text-slate-400">PDF / Word Document format</p>
                  </div>
                </div>
                <a
                  href={application.jobSeeker.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-white font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  View Resume
                </a>
              </div>
            )}
          </div>

          {/* Right Column: Job Specs, Status Actions & Match Score */}
          <div className="space-y-8">
            
            {/* Status Actions Widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Application Pipeline</h3>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current Status</p>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      application.status === "SHORTLISTED"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        : application.status === "REJECTED"
                        ? "bg-red-500/10 border-red-500/20 text-red-500"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                    }`}
                  >
                    {application.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Update Status</p>
                  <ApplicationActions
                    applicationId={application.id}
                    currentStatus={application.status}
                  />
                </div>
              </div>
            </div>

            {/* Skill Match Analytics Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Match Insights</h3>
              <SkillMatchBar
                percent={skillMatch.percent}
                matched={skillMatch.matched}
                total={skillMatch.total}
                matchedLabels={skillMatch.matchedLabels}
                className="max-w-none"
              />
              
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Required & Secondary Skills for this Job:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[...(application.job.requiredSkills ?? []), ...(application.job.secondarySkills ?? [])].map((reqSkill, sIdx) => {
                      const matched = skillMatch.matchedLabels.some(l => l.toLowerCase() === reqSkill.toLowerCase());
                      return (
                        <span
                          key={sIdx}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            matched
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-slate-100 border-slate-200 text-slate-500"
                          }`}
                        >
                          <span className="text-[10px]">{matched ? "✓" : "✗"}</span>
                          {reqSkill}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Candidate Profile Skills:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {application.jobSeeker.skills.map((skill, sIdx) => {
                      const isReq = [...(application.job.requiredSkills ?? []), ...(application.job.secondarySkills ?? [])].some(r => skillKeywordMatch(r, skill));
                      return (
                        <span
                          key={sIdx}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            isReq 
                              ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                              : "bg-slate-100 border-slate-200 text-slate-700"
                          }`}
                        >
                          {skill} {isReq && <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest ml-1">(Matched)</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Applied Job Details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Position Applied For</p>
                <h3 className="text-xl font-black text-foreground tracking-tight mt-1">{application.job.title}</h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">{application.job.category}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Location</p>
                    <p className="text-xs font-bold text-slate-700">{formatLocation(application.job.location, false)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Job Type & Mode</p>
                    <p className="text-xs font-bold text-slate-700">
                      {formatEmploymentType(application.job.employmentType)} · {application.job.workMode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <BadgeDollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Salary Package</p>
                    <p className="text-xs font-bold text-slate-700">
                      {formatSalary(application.job.salaryMin, application.job.salaryMax, application.job.currency, application.job.payType)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Applied Date</p>
                    <p className="text-xs font-bold text-slate-700">
                      {new Date(application.appliedAt).toLocaleDateString(undefined, { dateStyle: "long" })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <Link href={`/employer/jobs/${application.job.id}`} className="w-full">
                  <button className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all active:scale-95">
                    View Full Job Post
                  </button>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
