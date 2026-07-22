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
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200">
               <FileText className="h-9 w-9 text-amber-500" />
            </div>
            <p className="mb-6 text-base font-semibold text-slate-600">Complete your profile to access this section.</p>
            <Link href="/employer/profile">
              <Button className="h-11 px-8 rounded-xl bg-primary hover:bg-blue-700 text-white font-semibold uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95">
                <span style={{ color: "white" }}>Complete Profile</span>
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

