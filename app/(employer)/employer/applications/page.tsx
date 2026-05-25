import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import EmployerApplicationListClient from "@/components/employer/EmployerApplicationListClient";

export default async function EmployerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireEmployer();
  const params = await searchParams;

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return (
      <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-16 sm:px-6 md:px-8 lg:px-10 lg:py-24">
          <div className="linear-card rounded-[2.5rem] p-12 text-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/20">
               <FileText className="h-10 w-10 text-amber-500 animate-pulse" />
            </div>
            <p className="mb-8 text-xl font-bold text-muted-foreground italic">Operation Pending: Identity Authentication Required</p>
            <Link href="/employer/profile">
              <Button className="h-14 px-10 rounded-2xl bg-primary hover:bg-blue-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                Establish Corporate Presence
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const jobId = params.jobId as string | undefined;
  const statusRaw = params.status;
  const initialStatus =
    typeof statusRaw === "string"
      ? statusRaw
      : Array.isArray(statusRaw)
        ? statusRaw[0]
        : undefined;

  const jobs = await prisma.job.findMany({
    where: { postedBy: profile.userId },
    select: { id: true, title: true },
  });

  return (
    <EmployerApplicationListClient
      jobs={jobs}
      initialJobId={jobId}
      initialStatus={initialStatus}
    />
  );
}

