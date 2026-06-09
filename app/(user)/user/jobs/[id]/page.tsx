import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import JobDetails from "@/components/user/JobDetails";
import ApplicationForm from "@/components/user/ApplicationForm";

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireJobSeeker();
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      employer: {
        include: {
          user: true,
        },
      },
      applications: {
        where: { jobSeekerId: user.id },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const hasApplied = job.applications.length > 0;
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-16">
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
          <JobDetails job={job} />
          
          {!hasApplied && profile && (
            <div className="mt-12">
              <ApplicationForm 
                jobId={job.id} 
                currentResumeUrl={profile.resumeUrl} 
                currentResumeUpdatedAt={profile.resumeUpdatedAt} 
              />
            </div>
          )}
          
          {hasApplied && (
            <div className="mt-12 linear-card rounded-[2rem] p-8 border-primary/20 bg-primary/5">
              <p className="text-lg font-black text-primary uppercase tracking-widest flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Application Active
              </p>
              <p className="mt-2 text-muted-foreground font-medium">
                Your credentials have been transmitted to the employer. 
                <span className="ml-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                  Status: {job.applications[0].status}
                </span>
              </p>
            </div>
          )}
          
          {!profile && (
            <div className="mt-12 linear-card rounded-[2rem] p-8 border-2 border-black/20 bg-black/5">
              <p className="text-lg font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-foreground" />
                Profile Incomplete
              </p>
              <p className="mt-2 text-muted-foreground font-medium">
                Establish your professional identity before initiating an application.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

