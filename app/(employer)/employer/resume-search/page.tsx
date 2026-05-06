import { requireEmployer } from "@/lib/auth-utils";
import EmployerResumeDatabaseSearch from "@/components/employer/EmployerResumeDatabaseSearch";
import { prisma } from "@/lib/prisma";
import { AlertCircle } from "lucide-react";

export default async function EmployerResumeSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireEmployer();
  
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
    select: { 
      resumeSearchEnabled: true, 
      subscriptionExpiry: true,
      subscriptionStatus: true
    },
  });

  const isExpired = profile?.subscriptionExpiry ? new Date(profile.subscriptionExpiry) < new Date() : true;
  const isRestricted = !profile?.resumeSearchEnabled || isExpired || profile.subscriptionStatus !== "ACTIVE";

  const params = await searchParams;

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        {isRestricted && (
          <div className="mb-12 linear-card rounded-[2rem] border-amber-500/20 bg-amber-500/5 p-8 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <AlertCircle className="h-6 w-6 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-400 font-bold uppercase tracking-widest">
              Resume Database access is not included in your current plan. Please upgrade to search resumes.
            </p>
          </div>
        )}

        {!isRestricted ? (
          <EmployerResumeDatabaseSearch searchParams={params} />
        ) : (
          <div className="linear-card rounded-[3rem] p-24 text-center border-dashed border-white/10 bg-white/[0.01] opacity-50">
            <p className="text-xl font-black text-muted-foreground/40 uppercase tracking-widest italic leading-relaxed">
              Resume Database Locked
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

